/** Side-effect and default imports for global/component CSS (App Router). */
declare module "*.css" {
  const content: Record<string, string>
  export default content
}

declare module "*.scss" {
  const content: Record<string, string>
  export default content
}
