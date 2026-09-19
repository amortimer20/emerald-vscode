## A small sample that exercises the first syntax extension.
@example
struct Student {
    const name: String
    var scores: List[Int]

    func passing?(): Bool {
        return scores.any? { score => score >= 70 }
    }
}

var student = Student("Ava", [82, 91, 76])
student.scores.append(88)

#[ Block comments may nest.
   #[ Like this. ]#
]#

const path = 'C:\Users\Ava'
const message = "#{student.name}: #{student.scores.count} scores"
print(message)
