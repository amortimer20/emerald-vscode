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

# Built-in class names for grammar inspection:
# AssertionError Base64 CancelledError Channel Console Csv CsvError Date DateTime
# DateTimeError DeadlockError Digest Directory Duration EncodingError Equatable
# Error File FileError FileHandle FileWriter Hashable Http HttpError InputError
# Instant Json JsonError Math Ordered Path Program Random RecursionError Regex
# RegexError RuntimeError Stopwatch Task TaskGroup Tasks Textual Time TimeZone
# Weekday
