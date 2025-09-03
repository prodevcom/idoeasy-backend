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
    '^@idoeasy/common(.*)$': '<rootDir>/common$1',
    '^@idoeasy/common$': '<rootDir>/common',
    '^@idoeasy/modules(.*)$': '<rootDir>/modules$1',
    '^@idoeasy/modules$': '<rootDir>/modules',
    '^@idoeasy/config(.*)$': '<rootDir>/config$1',
    '^@idoeasy/config$': '<rootDir>/config',
    '^@idoeasy/utils(.*)$': '<rootDir>/utils$1',
    '^@idoeasy/utils$': '<rootDir>/utils',
  },
};
