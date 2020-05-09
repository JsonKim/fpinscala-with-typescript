
namespace RNG {
  abstract class RNG {
    abstract nextInt(): [number, RNG]
  }

  class SimpleRNG extends RNG {
    constructor(readonly seed: bigint) {
      super()
    }

    nextInt(): [number, RNG] {
      // eslint-disable-next-line no-bitwise
      const newSeed = (this.seed * 0x5DEECE66Dn + 0xBn) & 0xFFFFFFFFFFFFn
      const nextRNG = new SimpleRNG(newSeed)
      // eslint-disable-next-line no-bitwise
      const n = new Int32Array([parseInt(String(newSeed >> 16n), 10)])[0]
      return [n, nextRNG]
    }
  }

  type Rand<A> = (rng: RNG) => [A, RNG]

  const int = (rng: RNG) => rng.nextInt()

  const unit = <A>(a: A): Rand<A> =>
    (rng: RNG) => [a, rng]

  const map = <A>(s: Rand<A>) => <B>(f: (a: A) => B): Rand<B> =>
    (rng: RNG) => {
      const [a, rng2] = s(rng)
      return [f(a), rng2]
    }

  export const main = () => {
    const rng = new SimpleRNG(42n)

    const [n1, rng2] = rng.nextInt()
    console.log(n1)

    const [n2, rng3] = rng2.nextInt()
    console.log(n2)
  }
}

RNG.main()
