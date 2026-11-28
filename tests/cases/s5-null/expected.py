import random


def __kururi_show(value, inner=False):
    if value is None:
        return "null"
    if value is True:
        return "true"
    if value is False:
        return "false"
    if isinstance(value, list):
        return "[" + ", ".join(__kururi_show(item, True) for item in value) + "]"
    if inner and isinstance(value, str):
        return '"' + value.replace('\\', '\\\\').replace('"', '\\"') + '"'
    return str(value)


class Node:
    def __init__(self, value):
        self.next = None
        self.value = value


def find_first_long(words):
    for w in words:
        if len(w) > 3:
            return w
    return None


def main():
    name = input()
    age = int(input())
    found = find_first_long([name, "ab", "abcdef"])
    if found is not None:
        print(f"長い名前: {found}（{len(found)} 文字）")
    else:
        print("なし")
    print(__kururi_show(found))
    print("true" if age > 18 else "false")
    head = Node(1)
    head.next = Node(2)
    cur = head
    sum = 0
    while cur is not None:
        sum += cur.value
        cur = cur.next
    print(sum)
    print((sum // 2) + random.randint(1, 1))


if __name__ == "__main__":
    main()
