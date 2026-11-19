export const SUPPORTED_LANGUAGES = [
  {
    id: 'cpp',
    name: 'C++',
    monacoLang: 'cpp',
    version: '10.2.0 (GCC)',
    fileExt: '.cpp',
    badge: 'C++17',
    defaultInput: 'Developer',
    starterCode: `#include <iostream>
#include <string>

int main() {
    std::string name;
    std::cout << "=== C++ Execution Output ===" << std::endl;
    
    // Reads input from standard input (stdin) if provided
    if (std::cin >> name) {
        std::cout << "Hello, " << name << "! Welcome to the C++ compiler." << std::endl;
    } else {
        std::cout << "Hello, World! (Provide custom input on the right panel to customize this)" << std::endl;
    }

    std::cout << "Computation complete." << std::endl;
    return 0;
}
`
  },
  {
    id: 'python',
    name: 'Python',
    monacoLang: 'python',
    version: '3.10.0',
    fileExt: '.py',
    badge: 'Python 3',
    defaultInput: 'Antigravity Explorer',
    starterCode: `import sys

def main():
    print("=== Python Execution Output ===")
    
    # Read custom input from stdin
    user_input = sys.stdin.readline().strip()
    
    if user_input:
        print(f"Hello, {user_input}! Your Python code executed successfully.")
    else:
        print("Hello, World! Tip: Enter text in the Custom Input panel to test stdin.")
        
    numbers = [x * 2 for x in range(1, 6)]
    print(f"Sample List Comprehension: {numbers}")

if __name__ == "__main__":
    main()
`
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    monacoLang: 'javascript',
    version: '18.15.0 (Node.js)',
    fileExt: '.js',
    badge: 'Node.js',
    defaultInput: 'JavaScript Coder',
    starterCode: `const fs = require('fs');

function main() {
    console.log("=== JavaScript (Node.js) Execution Output ===");
    
    let input = '';
    try {
        input = fs.readFileSync(0, 'utf-8').trim();
    } catch (e) {
        input = '';
    }

    if (input) {
        console.log(\`Hello, \${input}! Welcome to the online JavaScript environment.\`);
    } else {
        console.log("Hello, World! You can pass standard input via the Custom Input box.");
    }

    const data = { status: "ready", timestamp: new Date().toISOString() };
    console.log("Structured Output:", JSON.stringify(data, null, 2));
}

main();
`
  },
  {
    id: 'java',
    name: 'Java',
    monacoLang: 'java',
    version: '15.0.2',
    fileExt: '.java',
    badge: 'OpenJDK',
    defaultInput: 'Java Enthusiast',
    starterCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        System.out.println("=== Java Execution Output ===");
        
        Scanner scanner = new Scanner(System.in);
        if (scanner.hasNextLine()) {
            String input = scanner.nextLine().trim();
            if (!input.isEmpty()) {
                System.out.println("Hello, " + input + "! Your Java program ran successfully.");
            } else {
                System.out.println("Hello, World!");
            }
        } else {
            System.out.println("Hello, World! Custom input can be entered in the stdin box.");
        }
        
        scanner.close();
    }
}
`
  }
];

export const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES[1]; // Python as default
