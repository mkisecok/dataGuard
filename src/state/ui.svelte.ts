/**
 * Ephemeral cross-component UI state. Nothing here is persisted and nothing
 * here belongs to the document — nothing in this file should ever influence
 * what gets transmitted.
 */
class UiState {
  /**
   * Span ids currently highlighted from the rail. Lets a findings row and the
   * corresponding place in the text light up together, which is how you check a
   * detection without hunting for it.
   */
  hoveredSpans = $state.raw<number[]>([]);

  /** Below 1080px the rail becomes a bottom sheet. */
  railOpen = $state(false);

  /**
   * Manual paste fallback. Opened automatically when a request fails, since a
   * CORS block is the most common reason the direct call cannot work and the
   * user needs the escape hatch right then.
   */
  manualOpen = $state(false);

  hover(spanIds: number[]): void {
    this.hoveredSpans = spanIds;
  }

  clearHover(): void {
    this.hoveredSpans = [];
  }
}

export const ui = new UiState();
