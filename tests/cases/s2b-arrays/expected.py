from __future__ import annotations


names: list[str] = ["apple", "banana"]


def main() -> None:
    fruits: list[str] = ["apple", "banana"]
    fruits[1] = "melon"
    fruits.append("grape")
    fruits.pop(0)
    count: int = len(fruits)
    weights: list[float] = [1.0, 2.5]
    grid: list[list[int]] = [[1, 2], [3, 4]]
    empty: list[int] = []
    print(f"{count} 個")
    for fruit in fruits:
        print(fruit)
    for row in grid:
        for v in row:
            weights.append(float(v))
    print(names[0][0])


if __name__ == "__main__":
    main()
