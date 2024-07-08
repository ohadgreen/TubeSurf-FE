
export const formatDateString = (dateString) => {
    let date = new Date(dateString);
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    var formattedDateString = year + "-" + month + "-" + day;
    return formattedDateString;
}