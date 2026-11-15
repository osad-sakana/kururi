from __future__ import annotations
import random


def __kururi_show(value: object) -> str:
    if value is None:
        return "null"
    if value is True:
        return "true"
    if value is False:
        return "false"
    return str(value)


class Node:
    def __init__(self, value: int) -> None:
        self.next = None
        self.value = value


def findFirstLong(words: list[str]) -> str | None:
    for w in words:
        if len(w) > 3:
            return w
    return None


def main() -> None:
    name: str = input()
    age: int = int(input())
    found: str | None = findFirstLong([name, "ab", "abcdef"])
    if found is not None:
        print(f"長い名前: {found}（{len(found)} 文字）")
    else:
        print("なし")
    print(__kururi_show(found))
    print("true" if age > 18 else "false")
    head: Node = Node(1)
    head.next = Node(2)
    cur: Node | None = head
    sum: int = 0
    while cur is not None:
        sum += cur.value
        cur = cur.next
    print(sum)
    print((sum // 2) + random.randint(1, 1))


if __name__ == "__main__":
    main()
