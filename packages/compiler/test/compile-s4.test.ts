import { describe, expect, it } from "vitest"
import { compile } from "../src"

const codesOf = (source: string): string[] => compile(source).diagnostics.map((d) => d.code)
const withMain = (defs: string, body = ""): string => `${defs}\nfunction main = () {\n${body}\n}\n`

const PLAYER = `class Player = {
  name: string
  public age: int = 20
  private score: int = 0

  constructor = (name: string) {
    self.name = name
  }

  public function run = () {
    self.draw()
    self.score += 1
  }

  public function getName = () -> string {
    return self.name
  }

  function draw = () {
  }
}`

describe("compile (S4): 生成", () => {
  it("クラスを class にし、フィールドの初期値を __init__ の先頭に出す", () => {
    const { python, diagnostics } = compile(withMain(PLAYER, '  var p: Player = new Player("taro")\n  p.run()\n  output(p.getName())\n  output(p.age)'))
    expect(diagnostics).toEqual([])
    expect(python).toContain(
      "class Player:\n    def __init__(self, name):\n        self.age = 20\n        self.score = 0\n        self.name = name\n",
    )
    expect(python).toContain("    def run(self):\n        self.draw()\n        self.score += 1")
    expect(python).toContain('p = Player("taro")')
    expect(python).toContain("p.run()")
    expect(python).toContain("print(p.getName())")
  })

  it("constructor がなければ、初期値だけの __init__ を作る", () => {
    const { python } = compile(withMain("class Box = {\n  items: int[] = []\n  public function size = () -> int {\n    return self.items.length\n  }\n}", "  var b: Box = new Box()\n  output(b.size())"))
    expect(python).toContain("class Box:\n    def __init__(self):\n        self.items = []\n")
    expect(python).toContain("return len(self.items)")
  })

  it("空のクラスは pass", () => {
    expect(compile(withMain("class Empty = {\n}")).python).toContain("class Empty:\n    pass")
  })

  it("オブジェクトの配列と、他のオブジェクトのフィールド", () => {
    const src = withMain(
      "class Node = {\n  public value: int\n  constructor = (value: int) {\n    self.value = value\n  }\n  public function same = (other: Node) -> boolean {\n    return self.value == other.value\n  }\n}",
      "  var nodes: Node[] = [new Node(1), new Node(2)]\n  nodes.push(new Node(3))\n  nodes[0].value = 5\n  nodes[1].value += 1\n  output(nodes[0].same(nodes[1]))",
    )
    expect(codesOf(src)).toEqual([])
    expect(compile(src).python).toContain("nodes[0].value = 5")
  })

  it("float のフィールド・引数に int を渡すと変換する", () => {
    const { python } = compile(withMain("class P = {\n  public x: float = 0\n  constructor = (x: float) {\n    self.x = x\n  }\n}", "  var p: P = new P(1)"))
    expect(python).toContain("self.x = 0.0")
    expect(python).toContain("p = P(1.0)")
  })

  it("クラスの自分自身の名前は本体の中で使える", () => {
    expect(codesOf(withMain("class Chain = {\n  public function copy = (other: Chain) -> Chain {\n    return other\n  }\n}"))).toEqual([])
  })

  it("メソッドも関数と同様に global を付ける", () => {
    const { python } = compile(withMain("var n: int = 0\nclass C = {\n  public function bump = () {\n    n += 1\n  }\n}"))
    expect(python).toContain("def bump(self):\n        global n\n        n += 1")
  })
})

describe("compile (S4): 診断", () => {
  it("private のメンバを外から使うと K0401", () => {
    expect(codesOf(withMain(PLAYER, '  var p: Player = new Player("a")\n  output(p.score)'))).toEqual(["K0401"])
    expect(codesOf(withMain(PLAYER, '  var p: Player = new Player("a")\n  p.draw()'))).toEqual(["K0401"])
    expect(codesOf(withMain(PLAYER, '  var p: Player = new Player("a")\n  p.name = "b"'))).toEqual(["K0401"])
  })

  it("同じクラスの中なら、他のインスタンスの private も使える", () => {
    expect(
      codesOf(withMain("class A = {\n  v: int = 1\n  public function eq = (o: A) -> boolean {\n    return self.v == o.v\n  }\n}")),
    ).toEqual([])
  })

  it("初期値のないフィールドを constructor が代入しないと K0405", () => {
    expect(codesOf(withMain("class A = {\n  x: int\n}"))).toEqual(["K0405"])
    expect(codesOf(withMain("class A = {\n  x: int\n  constructor = () {\n  }\n}"))).toEqual(["K0405"])
    expect(codesOf(withMain("class A = {\n  x: int\n  constructor = (f: boolean) {\n    if f {\n      self.x = 1\n    }\n  }\n}"))).toEqual(["K0405"])
  })

  it("if / else の両方で代入していればよい", () => {
    expect(codesOf(withMain("class A = {\n  x: int\n  constructor = (f: boolean) {\n    if f {\n      self.x = 1\n    } else {\n      self.x = 2\n    }\n  }\n}"))).toEqual([])
  })

  it("self をクラスの外で使うと K0404", () => {
    expect(codesOf(withMain("", "  output(self)"))).toEqual(["K0404"])
    expect(codesOf(withMain("function f = () {\n  self.x = 1\n}"))).toEqual(["K0404"])
  })

  it("クラスを定義より前の行で使うと K0403", () => {
    expect(codesOf(withMain("function f = () {\n  var a: A = new A()\n}\nclass A = {\n}"))).toEqual(["K0403", "K0403"])
  })

  it("知らないクラス・メンバ・引数の誤り", () => {
    expect(codesOf(withMain("", "  var a: Foo = new Foo()"))).toEqual(["K0208", "K0201"])
    expect(codesOf(withMain(PLAYER, '  var p: Player = new Player()'))).toEqual(["K0305"])
    expect(codesOf(withMain(PLAYER, '  var p: Player = new Player(1)'))).toEqual(["K0301"])
    expect(codesOf(withMain(PLAYER, '  var p: Player = new Player("a")\n  output(p.nothing)'))).toEqual(["K0317"])
    expect(codesOf(withMain(PLAYER, '  var p: Player = new Player("a")\n  p.getName(1)'))).toEqual(["K0305"])
    expect(codesOf(withMain(PLAYER, '  var p: Player = new Player("a")\n  var n: int = p.getName()'))).toEqual(["K0301"])
  })

  it("型の違うオブジェクトは代入できない", () => {
    expect(codesOf(withMain("class A = {\n}\nclass B = {\n}", "  var a: A = new B()"))).toEqual(["K0301"])
  })

  it("オブジェクトは表示できない（K0313）", () => {
    expect(codesOf(withMain("class A = {\n}", "  var a: A = new A()\n  output(a)"))).toEqual(["K0313"])
  })

  it("クラスの宣言の誤り", () => {
    expect(codesOf(withMain("class A = {\n  x: int = 1\n  function x = () {\n  }\n}"))).toEqual(["K0202"])
    expect(codesOf(withMain("class A = {\n  x: int = 1\n  x: int = 2\n}"))).toEqual(["K0202"])
    expect(codesOf(withMain("class A = {\n  public constructor = () {\n  }\n}"))).toEqual(["K0408"])
    expect(codesOf(withMain("class A = {\n  constructor = () {\n  }\n  constructor = () {\n  }\n}"))).toEqual(["K0202"])
    expect(codesOf(withMain("class A = {\n}\nclass A = {\n}"))).toEqual(["K0202"])
    expect(codesOf(withMain("class int = {\n}"))).toEqual(["K0501"])
  })

  it("メソッドの return 抜け・フィールドの型の誤り", () => {
    expect(codesOf(withMain("class A = {\n  function f = () -> int {\n  }\n}"))).toEqual(["K0322"])
    expect(codesOf(withMain("class A = {\n  x: Foo\n}"))).toEqual(["K0208"])
    expect(codesOf(withMain("class A = {\n  x: int = \"s\"\n}"))).toEqual(["K0301"])
  })

  it("トップレベルの初期値で new は使えない（K0323）", () => {
    expect(codesOf(withMain("class A = {\n}\nconst a: A = new A()"))).toEqual(["K0323"])
  })

  it("クラス名は値として使えない", () => {
    expect(codesOf(withMain("class A = {\n}", "  var a: int = A"))).toEqual(["K0309"])
  })

  it("length や push はオブジェクトの代入先にはできない", () => {
    expect(codesOf(withMain("", "  var a: int[] = [1]\n  a.length = 3"))).toEqual(["K0112"])
  })
})
