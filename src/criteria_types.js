
const criteria_types = [{
    text: 'Region',
    value: 'region'
},{
    text: 'System',
    value: 'system'
},{
    text: 'System Security',
    value: 'system_security'
},{
    text: 'Station',
    value: 'station'
},{
    text: 'Docked in Station / Structure',
    value: 'docked'
}];

const criteria_types_dict = {};

criteria_types.forEach((type) => {
    criteria_types_dict[type.value] = type.text;
});

module.exports = {
    list: criteria_types,
    dict: criteria_types_dict
};
