class Player:
    def __init__(self, name):
        self.age = 20
        self.nickname = "none"
        self.items = []
        self.name = name

    def run(self):
        self.draw()
        self.update()

    def describe(self):
        return f"{self.name}（{self.age}歳）"

    def draw(self):
        print("draw")

    def update(self):
        self.age += 1
        self.items.append(self.nickname)


def main():
    pl = Player("taro")
    pl.run()
    print(pl.describe())
    print(pl.age)


if __name__ == "__main__":
    main()
