module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@entech/common(.*)$': '<rootDir>/common$1',
    '^@entech/common$': '<rootDir>/common',
    '^@entech/modules(.*)$': '<rootDir>/modules$1',
    '^@entech/modules$': '<rootDir>/modules',
    '^@entech/config(.*)$': '<rootDir>/config$1',
    '^@entech/config$': '<rootDir>/config',
    '^@entech/utils(.*)$': '<rootDir>/utils$1',
    '^@entech/utils$': '<rootDir>/utils',
  },
};
