NAMES = ["apple", "banana"]


def main():
    fruits = ["apple", "banana"]
    fruits[1] = "melon"
    fruits.append("grape")
    fruits.pop(0)
    count = len(fruits)
    weights = [1.0, 2.5]
    grid = [[1, 2], [3, 4]]
    empty = []
    print(f"{count} 個")
    for fruit in fruits:
        print(fruit)
    for row in grid:
        for v in row:
            weights.append(float(v))
    print(NAMES[0][0])


if __name__ == "__main__":
    main()
