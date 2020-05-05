import 'fp-ts/lib/HKT'

declare module 'fp-ts/lib/HKT' {
  interface URItoKind<A> {
    readonly Tree: Tree<A>
  }
}

export const URI = 'Tree'

export type URI = typeof URI

type Tree<A> = Leaf<A> | Branch<A>

interface Leaf<A> {
  readonly _tag: 'Leaf'
  readonly value: A
}

interface Branch<A> {
  readonly _tag: 'Branch'
  readonly left: Tree<A>
  readonly right: Tree<A>
}

const Leaf = <A>(a: A): Leaf<A> => ({
  _tag: 'Leaf',
  value: a,
})

const Branch = <A>(l: Tree<A>, r: Tree<A>): Tree<A> => ({
  _tag: 'Branch',
  left: l,
  right: r,
})

module Tree {
  const size = <A>(tree: Tree<A>): number => {
    if (tree._tag === 'Leaf') {
      return 1
    } else {
      return 1 + size(tree.left) + size(tree.right)
    }
  }

  const maximum = (t: Tree<number>): number => {
    if (t._tag === 'Leaf') {
      return t.value
    } else {
      return Math.max(maximum(t.left), maximum(t.right))
    }
  }

  const depth = <A>(t: Tree<A>): number => {
    if (t._tag === 'Leaf') {
      return 0
    } else {
      return 1 + Math.max(depth(t.left), depth(t.right))
    }
  }

  const map = <A>(t: Tree<A>) => <B>(f: (a: A) => B): Tree<B> => {
    if (t._tag === 'Leaf') {
      return Leaf(f(t.value))
    } else {
      return Branch(map(t.left)(f), map(t.right)(f))
    }
  }

  // List의 foldRight가 아래와 같이 구조가 나타나는것 처럼
  // foldRight(l, nil)((h, t) => cons(h, t))
  // foldRight(l, nil)(cons)
  // Tree의 fold도 아래와 같이 구조를 유지할 수 있다.
  // fold(t)(x => Leaf(x))((l, r) => Branch(l, r))
  // fold(t)(Leaf)(Branch)
  // data constructor의 구조가 역으로 구현된다고 볼 수 있겠다.
  const fold = <A>(t: Tree<A>) => <B>(l: (a: A) => B) => (b: (l: B, r: B) => B): B => {
    if (t._tag === 'Leaf') {
      return l(t.value)
    } else {
      return b(fold(t.left)(l)(b), fold(t.right)(l)(b))
    }
  }

  const depth2 = <A>(t: Tree<A>): number =>
    fold(t)(_ => 0)((l, r) => 1 + Math.max(l, r))
}
