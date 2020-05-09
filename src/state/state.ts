import {
  List, nil, cons, foldRight,
} from '../datastructures/list'

const INT_MAX_VALUE = 2 ** 31 - 1

namespace RNG {
  type Int = number
  type Double = number

  abstract class RNG {
    abstract nextInt(): [Int, RNG]
  }

  class SimpleRNG extends RNG {
    constructor(readonly seed: bigint) {
      super()
    }

    nextInt(): [Int, RNG] {
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

  const nonNegativeInt = (rng: RNG): [Int, RNG] =>
    map(int)(x => (x < 0 ? -(x + 1) : x))(rng)

  const double = (rng: RNG): [Double, RNG] =>
    map(nonNegativeInt)(n => n / (INT_MAX_VALUE + 1))(rng)

  const intDouble = (rng: RNG): [[Int, Double], RNG] => {
    const [n, rng2] = rng.nextInt()
    const [d, rng3] = double(rng2)
    return [[n, d], rng3]
  }

  const doubleInt = (rng: RNG): [[Double, Int], RNG] => {
    const [d, rng2] = double(rng)
    const [n, rng3] = rng2.nextInt()
    return [[d, n], rng3]
  }

  const doubleInt2 = (rng: RNG): [[Double, Int], RNG] =>
    map(doubleInt)(([d, n]): [Int, Double] => [n, d])(rng)

  const double3 = (rng: RNG): [[Double, Double, Double], RNG] => {
    const [d1, rng2] = double(rng)
    const [d2, rng3] = double(rng2)
    const [d3, rng4] = double(rng3)
    return [[d1, d2, d3], rng4]
  }

  const ints = (count: Int) => (rng: RNG): [List<Int>, RNG] => {
    if (count <= 0) return [nil, rng]

    const [n, rng2] = rng.nextInt()
    const [l, rng3] = ints(count - 1)(rng2)
    return [cons(n, l), rng3]
  }

  const ints2 = (count: Int) => (rng: RNG): [List<Int>, RNG] => {
    const go = (count: Int, rng: RNG, l: List<Int>): [List<Int>, RNG] => {
      if (count <= 0) return [l, rng]

      const [n, rng2] = int(rng)
      return go(count - 1, rng2, cons(n, l))
    }

    return go(count, rng, nil)
  }

  const map2 = <A, B>(ra: Rand<A>, rb: Rand<B>) => <C>(f: (a: A, b: B) => C): Rand<C> =>
    (rng: RNG) => {
      const [a, rng2] = ra(rng)
      const [b, rng3] = rb(rng2)
      return [f(a, b), rng3]
    }

  const both = <A, B>(ra: Rand<A>, rb: Rand<B>): Rand<[A, B]> =>
    map2(ra, rb)((a, b) => [a, b])

  const sequence = <A>(fs: List<Rand<A>>): Rand<List<A>> =>
    foldRight(fs, unit(nil as List<A>))((a, acc) =>
      map2(a, acc)(cons))

  const flatMap = <A>(f: Rand<A>) => <B>(g: (a: A) => Rand<B>): Rand<B> =>
    rng => {
      const [a, s] = f(rng)
      return g(a)(s)
    }

  const nonNegativeLessThan = (n: Int): Rand<Int> =>
    flatMap(nonNegativeInt)(a => {
      const mod = a % n
      if (a + (n - 1) - mod >= 0) return unit(mod)
      else return nonNegativeLessThan(a)
    })

  const mapViaFlatMap = <A>(s: Rand<A>) => <B>(f: (a: A) => B): Rand<B> =>
    flatMap(s)(a => unit(f(a)))

  const map2ViaFlatMap = <A, B>(ra: Rand<A>, rb: Rand<B>) => <C>(f: (a: A, b: B) => C): Rand<C> =>
    flatMap(ra)(a =>
      map(rb)(b =>
        f(a, b)))

  export const main = () => {
    const rng = new SimpleRNG(42n)

    const [n1, rng2] = rng.nextInt()
    console.log(n1)

    const [n2, rng3] = rng2.nextInt()
    console.log(n2)

    const nn1 = nonNegativeInt(rng2)
    console.log(nn1)

    console.log(ints(3)(rng))
  }
}

RNG.main()
