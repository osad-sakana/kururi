from __future__ import annotations


class Player:
    def __init__(self, name: str) -> None:
        self.age = 20
        self.nickname = "none"
        self.items = []
        self.name = name

    def run(self) -> None:
        self.draw()
        self.update()

    def describe(self) -> str:
        return f"{self.name}（{self.age}歳）"

    def draw(self) -> None:
        print("draw")

    def update(self) -> None:
        self.age += 1
        self.items.append(self.nickname)


def main() -> None:
    pl: Player = Player("taro")
    pl.run()
    print(pl.describe())
    print(pl.age)


if __name__ == "__main__":
    main()
