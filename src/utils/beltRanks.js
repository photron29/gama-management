import beltRanksConfig from '../config/beltRanks.json';

// Get belt ranks for students
export const getStudentBeltRanks = () => {
    return beltRanksConfig.studentRanks;
};

// Get belt ranks for instructors
export const getInstructorBeltRanks = () => {
    return beltRanksConfig.instructorRanks;
};

// Format belt rank for display (capitalize first letter)
export const formatBeltRank = (rank) => {
    if (!rank || typeof rank !== 'string') {
        return 'Unknown';
    }
    return rank.charAt(0).toUpperCase() + rank.slice(1);
};
