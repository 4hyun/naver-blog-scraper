export function* idMaker(): Generator<number, never, unknown> {
  let id = Date.now();
  while (true) {
    yield id++;
  }
}
