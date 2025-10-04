/**
 * Utility functions for calculating form scores and comparing answers
 */

/**
 * Compare student answer with correct answer for a specific question type
 * @param {string} questionType - Type of question
 * @param {any} studentAnswer - Student's submitted answer
 * @param {any} correctAnswer - Correct answer from question
 * @returns {boolean} - Whether the answer is correct
 */
export function isAnswerCorrect(questionType, studentAnswer, correctAnswer) {
  if (!correctAnswer) return false;

  switch (questionType) {
    case 'multiple_choice':
    case 'dropdown':
    case 'true_false':
      return studentAnswer === correctAnswer;

    case 'checkboxes':
      if (!Array.isArray(studentAnswer) || !Array.isArray(correctAnswer)) {
        return false;
      }
      // For checkboxes, all selected options must be correct and all correct options must be selected
      if (studentAnswer.length !== correctAnswer.length) {
        return false;
      }
      return studentAnswer.every(answer => correctAnswer.includes(answer)) &&
             correctAnswer.every(answer => studentAnswer.includes(answer));

    case 'short_answer':
    case 'paragraph':
      // For text answers, do case-insensitive comparison
      if (typeof studentAnswer !== 'string' || typeof correctAnswer !== 'string') {
        return false;
      }
      return studentAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();

    case 'linear_scale':
      return parseInt(studentAnswer) === parseInt(correctAnswer);

    case 'date':
    case 'time':
      return studentAnswer === correctAnswer;

    default:
      return false;
  }
}

/**
 * Calculate score for a single question
 * @param {Object} question - Question object
 * @param {any} studentAnswer - Student's submitted answer
 * @returns {Object} - Score object with points earned and correctness
 */
export function calculateQuestionScore(question, studentAnswer) {
  const isCorrect = isAnswerCorrect(question.type, studentAnswer, question.correctAnswer);
  const pointsEarned = isCorrect ? (question.points || 1) : 0;

  return {
    isCorrect,
    pointsEarned,
    maxPoints: question.points || 1,
    correctAnswer: question.correctAnswer
  };
}

/**
 * Calculate total score for all form responses
 * @param {Array} questions - Array of question objects
 * @param {Object} responses - Object mapping questionId to student answers
 * @returns {Object} - Total score summary
 */
export function calculateFormScore(questions, responses) {
  let totalPoints = 0;
  let earnedPoints = 0;
  const questionResults = [];

  for (const question of questions) {
    const studentAnswer = responses[question.id];
    const questionScore = calculateQuestionScore(question, studentAnswer);

    totalPoints += questionScore.maxPoints;
    earnedPoints += questionScore.pointsEarned;
    questionResults.push({
      questionId: question.id,
      questionTitle: question.title,
      ...questionScore
    });
  }

  return {
    totalPoints,
    earnedPoints,
    percentage: totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0,
    questionResults
  };
}

/**
 * Format question results for display
 * @param {Object} questionResult - Result from calculateQuestionScore
 * @param {string} questionType - Type of question
 * @returns {Object} - Formatted result for display
 */
export function formatQuestionResultForDisplay(questionResult, questionType) {
  const { isCorrect, pointsEarned, maxPoints, correctAnswer } = questionResult;

  let displayText = '';
  let showCorrectAnswer = true;

  switch (questionType) {
    case 'multiple_choice':
    case 'dropdown':
    case 'true_false':
      displayText = isCorrect ? 'Correct' : `Incorrect (Correct: ${correctAnswer})`;
      break;

    case 'checkboxes':
      if (Array.isArray(correctAnswer)) {
        displayText = isCorrect ? 'Correct' : `Incorrect (Correct: ${correctAnswer.join(', ')})`;
      }
      break;

    case 'short_answer':
    case 'paragraph':
      displayText = isCorrect ? 'Correct' : `Incorrect (Correct: ${correctAnswer})`;
      break;

    case 'linear_scale':
      displayText = isCorrect ? 'Correct' : `Incorrect (Correct: ${correctAnswer})`;
      break;

    case 'date':
    case 'time':
      displayText = isCorrect ? 'Correct' : `Incorrect (Correct: ${correctAnswer})`;
      break;

    default:
      showCorrectAnswer = false;
      displayText = isCorrect ? 'Correct' : 'Incorrect';
  }

  return {
    isCorrect,
    pointsEarned,
    maxPoints,
    displayText,
    showCorrectAnswer,
    correctAnswer
  };
}