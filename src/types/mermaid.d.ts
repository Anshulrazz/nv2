declare module "mermaid" {
  interface MermaidConfig {
    startOnLoad?: boolean;
    theme?: string;
    darkMode?: boolean;
    themeVariables?: Record<string, string>;
  }

  interface RenderResult {
    svg: string;
  }

  const mermaid: {
    initialize: (config: MermaidConfig) => void;
    render: (id: string, code: string) => Promise<RenderResult>;
  };

  export default mermaid;
}
