export abstract class Widget {
  abstract render(): void
  public describe(): string {
    return 'widget'
  }
}
