import moment from "moment"

// Format date for display
export const formatDate = (date) => {
    if (!date) return 'N/A'
    return moment(date).tz('Asia/Manila').format('MMMM D, YYYY')
}