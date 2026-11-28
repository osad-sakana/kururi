LIMIT = 5
total = 0


def add(a, b):
    return a + b


class Counter:
    def __init__(self, start):
        self.count = 0
        self.count = start

    def next(self):
        self.count += 1
        return self.count


def main():
    global total
    for i in range(LIMIT):
        total = add(total, i)
    for k in range(LIMIT - 2):
        j = k + 2
        if j % 2 == 0:
            print(j)
        elif j == 3:
            print("three")
        else:
            print("other")
    names = ["a", "b"]
    for name in names:
        print(name)
    c = Counter(10)
    print(c.next())
    print(total)


if __name__ == "__main__":
    main()
