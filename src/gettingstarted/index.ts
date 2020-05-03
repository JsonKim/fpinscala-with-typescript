
module MyModule {
  export const abs = (n: number): number => {
    if (n < 0) return -n
    else return n
  }

  const formatAbs = (n: number): string => `The absolute value of ${n} is ${abs(n)}`

  export const main = () => {
    console.log(formatAbs(-42))
  }
}

MyModule.main()
