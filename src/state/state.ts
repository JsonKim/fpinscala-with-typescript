import {
  List, nil, cons, foldRight, map as Lmap,
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

namespace State {
  interface State<S, A> {
    (s: S): [A, S]
  }

  const unit = <S, A>(a: A): State<S, A> => s => [a, s]

  const flatMap = <S, A>(sa: State<S, A>) => <B>(f: (a: A) => State<S, B>): State<S, B> =>
    s => {
      const [a, s1] = sa(s)
      return f(a)(s1)
    }

  const map = <S, A>(sa: State<S, A>) => <B>(f: (a: A) => B): State<S, B> =>
    flatMap(sa)(a => unit(f(a)))

  const map2 = <S, A, B>(sa: State<S, A>, sb: State<S, B>) => <C>(f: (a: A, b: B) => C): State<S, C> =>
    flatMap(sa)(a =>
      map(sb)(b =>
        f(a, b)))

  const sequence = <S, A>(fs: List<State<S, A>>): State<S, List<A>> =>
    foldRight(fs, unit<S, List<A>>(nil as List<A>))((sa, l) => map2(sa, l)(cons))

  const get = <S>(): State<S, S> => s => [s, s]

  const set = <S>(s: S): State<S, void> => _ => [undefined, s]

  const modify = <S>(f: (s: S) => S): State<S, void> =>
    flatMap(get<S>())(s =>
      map(set(f(s)))(_ =>
        undefined))

  interface Coin { _tag: 'Coin' }
  interface Turn { _tag: 'Turn' }
  type Input = Coin | Turn

  interface Machine {
    readonly locked: boolean
    readonly candies: number
    readonly coins: number
  }

  const machine = (locked: boolean, candies: number, coins: number) => ({
    locked, candies, coins,
  })

  type Result = [number, number]
  const simulateMachine = (inputs: List<Input>): State<Machine, Result> => s => {
    const go = (input: Input): State<Machine, Result> => s => {
      if (s.candies === 0) return [[s.coins, s.candies], s]
      if (s.locked && input._tag === 'Coin') return [[s.coins, s.candies], machine(false, s.candies, s.coins + 1)]
      if (!s.locked && input._tag === 'Turn') return [[s.coins, s.candies], machine(false, s.candies - 1, s.coins)]
      else return [[s.coins, s.candies], s]
    }

    return foldRight(inputs, unit<Machine, Result>([s.coins, s.candies]))(go)(s)
  }

  const simulateMachine2 = (inputs: List<Input>): State<Machine, Result> => s => {
    // 입력에 의존해서 다음 상태를 만든다.
    const update = (input: Input) => (s: Machine): Machine => {
      if (s.candies === 0) return s
      if (s.locked && input._tag === 'Coin') return machine(false, s.candies, s.coins + 1)
      if (!s.locked && input._tag === 'Turn') return machine(false, s.candies - 1, s.coins)
      else return s
    }

    // input들을 상태 변경목록으로 바꾼다.
    const actions = Lmap(inputs)(i =>
      modify<Machine>(update(i)))

    // 상태 변경을 연속적으로 실행한다. 현재 상태에서 다음 상태로의 상태 전달은 sequence가 처리한다.
    return flatMap(sequence(actions))(_ =>
      // 최종 상태를 얻어온다. 상태는 값으로 전달된다.
      map(get<Machine>())((s): Result =>
        // 최종 결과를 산출한다.
        [s.coins, s.candies]))(s)
  }
}
