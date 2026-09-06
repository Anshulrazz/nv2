import { NextResponse } from "next/server";
import { auth } from "@/auth";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Course } from "@/models/Course";
import { User } from "@/models/User";
import { Coupon } from "@/models/Coupon";
import { CourseEnrollment } from "@/models/CourseEnrollment";
import { CoinTransaction } from "@/models/CoinTransaction";
import { getOrCreateUserWallet } from "@/lib/wallet";
import { isValidObjectId } from "@/lib/validation";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: courseId } = await params;
    if (!isValidObjectId(courseId)) {
      return NextResponse.json({ error: "Invalid course ID format." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { couponCode } = body || {};

    await connectToDatabase();

    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const student = await User.findById(userId);
    if (!student) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is already enrolled or is the instructor
    if (course.instructor.toString() === userId) {
      return NextResponse.json({
        message: "You are the instructor of this course.",
        isEnrolled: true,
      });
    }

    const existingEnrollment = await CourseEnrollment.findOne({
      userId,
      courseId,
    });

    if (existingEnrollment) {
      return NextResponse.json({
        message: "You are already enrolled in this course.",
        isEnrolled: true,
      });
    }

    const originalPrice = course.price || 0;
    let finalPrice = originalPrice;
    let appliedCoupon: string | undefined = undefined;

    // Handle free courses
    if (originalPrice === 0) {
      await CourseEnrollment.create({
        userId,
        courseId,
        instructorId: course.instructor,
        pricePaid: 0,
        creatorEarnings: 0,
        adminEarnings: 0,
      });

      return NextResponse.json({
        message: "Successfully enrolled in free course!",
        isEnrolled: true,
        pricePaid: 0,
      });
    }

    // Process coupon if provided
    if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
      const cleanCode = couponCode.trim().toUpperCase();
      const coupon = await Coupon.findOne({ code: cleanCode, isActive: true });
      if (coupon && new Date() <= new Date(coupon.validUntil) && coupon.usedCount < coupon.maxUses) {
        if (coupon.discountType === "percentage") {
          const discount = Math.round((originalPrice * coupon.discountValue) / 100);
          finalPrice = Math.max(0, originalPrice - discount);
        } else {
          finalPrice = Math.max(0, originalPrice - coupon.discountValue);
        }
        appliedCoupon = coupon.code;
        coupon.usedCount += 1;
        await coupon.save();
      }
    }

    const studentWallet = await getOrCreateUserWallet(student._id);

    // Sync wallet balance with user.coins (authoritative source)
    if (studentWallet.balance !== (student.coins || 0)) {
      studentWallet.balance = student.coins || 0;
      await studentWallet.save();
    }

    const currentCoins = student.coins || 0;
    if (currentCoins < finalPrice) {
      return NextResponse.json(
        {
          error: "INSUFFICIENT_BALANCE",
          message: `Insufficient coins balance. You need ${finalPrice} coins (₹${(finalPrice / 10).toFixed(2)}) but only have ${currentCoins} coins (₹${(currentCoins / 10).toFixed(2)}).`,
          requiredCoins: finalPrice,
          requiredINR: (finalPrice / 10).toFixed(2),
          currentBalance: currentCoins,
          currentINR: (currentCoins / 10).toFixed(2),
        },
        { status: 400 }
      );
    }

    // 70% to creator / instructor, 30% to platform admin
    const creatorEarnings = Math.floor(finalPrice * 0.7);
    const adminEarnings = finalPrice - creatorEarnings;

    const instructor = await User.findById(course.instructor);
    const instructorWallet = instructor ? await getOrCreateUserWallet(instructor._id) : null;

    const dbSession = await mongoose.startSession();
    try {
      await dbSession.withTransaction(async () => {
        // Deduct from student
        student.coins = (student.coins || 0) - finalPrice;
        await student.save({ session: dbSession });

        studentWallet.balance -= finalPrice;
        await studentWallet.save({ session: dbSession });

        // Credit 70% to instructor
        if (instructor && instructorWallet) {
          instructor.coins = (instructor.coins || 0) + creatorEarnings;
          instructor.creatorEarnings = (instructor.creatorEarnings || 0) + creatorEarnings;
          await instructor.save({ session: dbSession });

          instructorWallet.balance += creatorEarnings;
          await instructorWallet.save({ session: dbSession });
        }

        // Record Enrollment
        await CourseEnrollment.create(
          [
            {
              userId,
              courseId,
              instructorId: course.instructor,
              pricePaid: finalPrice,
              creatorEarnings,
              adminEarnings,
              couponCode: appliedCoupon,
            },
          ],
          { session: dbSession }
        );

        // Record Transactions
        if (finalPrice > 0) {
          await CoinTransaction.create(
            [
              {
                fromWalletAddress: studentWallet.address,
                toWalletAddress: instructorWallet ? instructorWallet.address : "CREATOR_VAULT",
                amount: creatorEarnings,
                type: "course_creator_payout",
                status: "completed",
                metadata: {
                  courseId,
                  courseTitle: course.title,
                  studentId: userId,
                  share: "70%",
                },
              },
              {
                fromWalletAddress: studentWallet.address,
                toWalletAddress: "SYSTEM_ADMIN_VAULT",
                amount: adminEarnings,
                type: "course_platform_fee",
                status: "completed",
                metadata: {
                  courseId,
                  courseTitle: course.title,
                  studentId: userId,
                  share: "30%",
                },
              },
            ],
            { session: dbSession }
          );
        }
      });
    } catch (txError) {
      console.warn("MongoDB transaction fallback for course purchase:", txError);
      // Non-replica set fallback
      student.coins = (student.coins || 0) - finalPrice;
      await student.save();
      studentWallet.balance -= finalPrice;
      await studentWallet.save();

      if (instructor && instructorWallet) {
        instructor.coins = (instructor.coins || 0) + creatorEarnings;
        instructor.creatorEarnings = (instructor.creatorEarnings || 0) + creatorEarnings;
        await instructor.save();
        instructorWallet.balance += creatorEarnings;
        await instructorWallet.save();
      }

      await CourseEnrollment.create({
        userId,
        courseId,
        instructorId: course.instructor,
        pricePaid: finalPrice,
        creatorEarnings,
        adminEarnings,
        couponCode: appliedCoupon,
      });

      if (finalPrice > 0) {
        await CoinTransaction.create({
          fromWalletAddress: studentWallet.address,
          toWalletAddress: instructorWallet ? instructorWallet.address : "CREATOR_VAULT",
          amount: creatorEarnings,
          type: "course_creator_payout",
          status: "completed",
          metadata: {
            courseId,
            courseTitle: course.title,
            studentId: userId,
            share: "70%",
          },
        });
        await CoinTransaction.create({
          fromWalletAddress: studentWallet.address,
          toWalletAddress: "SYSTEM_ADMIN_VAULT",
          amount: adminEarnings,
          type: "course_platform_fee",
          status: "completed",
          metadata: {
            courseId,
            courseTitle: course.title,
            studentId: userId,
            share: "30%",
          },
        });
      }
    } finally {
      await dbSession.endSession();
    }

    return NextResponse.json({
      message: `Successfully unlocked "${course.title}"!`,
      isEnrolled: true,
      pricePaid: finalPrice,
      creatorEarnings,
      adminEarnings,
      studentCoins: student.coins,
    });
  } catch (error) {
    console.error("Course enrollment error:", error);
    return NextResponse.json({ error: "Failed to enroll in course." }, { status: 500 });
  }
}
