import re

with open("src/app/(dashboard)/feed/page.tsx", "r") as f:
    content = f.read()

# 1. Update Interfaces
interface_repl = """
interface Author {
  _id: string;
  name: string;
  image?: string;
}

interface PostData {
  _id: string;
  type?: "note" | "community";
  // Note specific
  title?: string;
  slug?: string;
  tags?: string[];
  category?: string;
  coverImage?: string;
  readingTime?: string;
  wordCount?: number;
  upvotes?: string[];
  isPinned?: boolean;
  upvotesCount?: number;
  commentsCount?: number;
  author?: Author;
  // Community specific
  userId?: string;
  userName?: string;
  userImage?: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: string;
  likes?: string[];
  // Common
  comments?: any[];
  createdAt: string;
}
"""

content = re.sub(r'interface Author \{.*?\n\}[\s\S]*?interface PostData \{.*?\n\}', interface_repl.strip(), content, count=1, flags=re.MULTILINE|re.DOTALL)


# 2. Update fetchPosts
fetch_logic = """
  const fetchPosts = useCallback(async (reset = false) => {
    setIsLoading(true);
    const currentPage = reset ? 1 : pageRef.current;
    try {
      const queryParams = new URLSearchParams({
        sort,
        search,
        tag,
        category,
        page: currentPage.toString(),
        limit: "10",
      });

      const res = await fetch(`/api/feed?${queryParams.toString()}`);
      let fetchedNotes = [];
      if (res.ok) {
        const data = await res.json();
        fetchedNotes = data.map((n: any) => ({ ...n, type: "note" }));
      }
      
      let fetchedCommunity = [];
      if (reset && (category === "" || category === "Community" || category === "Forum")) {
        const cRes = await fetch(`/api/community`);
        if (cRes.ok) {
          const cData = await cRes.json();
          fetchedCommunity = cData.map((c: any) => ({ ...c, type: "community" }));
        }
      }

      const merged = [...fetchedNotes, ...fetchedCommunity].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (reset) {
        setPosts(merged);
        pageRef.current = 2;
      } else {
        setPosts((prev) => [...prev, ...merged].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        pageRef.current = pageRef.current + 1;
      }
      
      if (fetchedNotes.length < 10) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [sort, search, tag, category]);
"""

content = re.sub(r'const fetchPosts = useCallback\(async \(reset = false\) => \{.*?\}, \[sort, search, tag, category\]\);', fetch_logic.strip(), content, count=1, flags=re.MULTILINE|re.DOTALL)


# 3. Add tags
tags_logic = """
            <h3
              className="text-[10px] font-bold text-neutral-350 uppercase tracking-widest"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Trending Topics
            </h3>
            <div className="flex flex-col gap-2.5">
              {["Forum", "Community", "Blog", "Note", "Education", "Technology"].map((tagItem) => (
"""
content = re.sub(r'<h3[^>]*>\s*Trending Topics\s*</h3>\s*<div className="flex flex-col gap-2\.5">\s*\{\["Education", "Technology", "Lifestyle", "Science", "Writing"\]\.map\(\(tagItem\) => \(', tags_logic.strip(), content, count=1, flags=re.MULTILINE|re.DOTALL)

# 4. Render loop
render_logic = """
              {posts.map((post) => {
                if (post.type === "community") {
                   const isLiked = post.likes?.includes(currentUserId || "");
                   return (
                    <div key={post._id} className="glass glass-card-hover overflow-hidden p-6 space-y-5 transition-all duration-300">
                      <div className="flex items-center gap-3 select-none">
                        {post.userImage ? (
                          <img src={post.userImage} alt={post.userName} className="h-9 w-9 rounded-full object-cover border border-neutral-800" />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-neutral-950 border border-neutral-850 flex items-center justify-center text-neutral-500 text-sm font-bold">
                            {post.userName?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <Link href={`/user/${post.userId}`}>
                            <p className="text-xs font-bold text-neutral-200 hover:text-cyan-400 transition-colors leading-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                              {post.userName}
                            </p>
                          </Link>
                          <p className="text-[10px] text-neutral-605 mt-0.5" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                            {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                           <span className="text-[9px] bg-neutral-950 border border-cyan-400/30 text-cyan-400 font-bold px-2 py-0.5 rounded" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>#Community</span>
                        </div>
                      </div>
                      
                      <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>

                      {post.mediaUrl && (
                        <div className="flex items-center justify-start w-full">
                          {post.mediaType === "image" ? (
                            <img src={post.mediaUrl} alt="Post content" className="max-h-[300px] object-contain w-auto rounded-xl border border-neutral-900 bg-neutral-950/40" />
                          ) : (
                            <video src={post.mediaUrl} controls className="max-h-[300px] object-contain w-auto rounded-xl border border-neutral-900 bg-neutral-950/40" />
                          )}
                        </div>
                      )}
                    </div>
                   );
                }

                const userHasUpvoted = post.upvotes?.includes(currentUserId);
                const following = followingMap[post.author?._id || ""];

                // Lazy-fetch follow statuses
                if (following === undefined && post.author?._id !== currentUserId && post.author) {
                  checkFollowStatus(post.author._id);
                }

                return (
"""

content = re.sub(r'\{posts\.map\(\(post\) => \{\s*const userHasUpvoted = post\.upvotes\?\.includes\(currentUserId\);\s*const following = followingMap\[post\.author\._id\];\s*// Lazy-fetch follow statuses\s*if \(following === undefined && post\.author\._id !== currentUserId\) \{\s*checkFollowStatus\(post\.author\._id\);\s*\}\s*return \(', render_logic.strip(), content, count=1, flags=re.MULTILINE|re.DOTALL)


# Fix missing author property usage
content = content.replace("post.author._id", "post.author?._id")
content = content.replace("post.author.name", "post.author?.name")
content = content.replace("post.author.image", "post.author?.image")


with open("src/app/(dashboard)/feed/page.tsx", "w") as f:
    f.write(content)
