const errors = require('../config/errors');
const _ = require('lodash');
const fs = require('fs');

const parseSequelizeError = (error) => {
    
    let parsedErrorMessage;
    switch (error.name) {
        case "SequelizeDatabaseError":
            parsedErrorMessage = errors.INTERNAL_ERROR;
        break;

        case "SequelizeValidationError":
            parsedErrorMessage = `${error.errors[0].value} ${error.errors[0].message}`;
        break;

        case "SequelizeUniqueConstraintError":
            parsedErrorMessage = errors.FIELD_DUPLICATED.replace('@VALUE', error.errors[0].value);
        break;

        case "SequelizeForeignKeyConstraintError":
            parsedErrorMessage = errors.FOREING_KEY_MISSING;
        break;
    
        default:
            parsedErrorMessage = errors.INTERNAL_ERROR;
            break;
    }
    return parsedErrorMessage
};

const validateRequiredFields = (obj, fieldsToInclude) => {
    let new_entity = {};

    //  Prepare the new entity with all the required fields
    for (let index = 0; index < fieldsToInclude.length; index++) {
        
        let field = fieldsToInclude[index];

        if (obj.hasOwnProperty(field)) {
            new_entity[ field ] = obj[ field ]
        }else{
            throw {
                isCustomError: true,
                body: errors.MISSING_PROPERTY.replace('@PROPERTY', field)
            }
        }

    }

    return new_entity;
};

const transformArrayToOneDimension = (arrayOfNDimensions) => {
    if(!Array.isArray(arrayOfNDimensions)){
        return [arrayOfNDimensions]
    }
    return _.uniq(arrayOfNDimensions.reduce((acum, item) =>{
        if(Array.isArray(item)){
          return [
            ...acum,
            ...transformArrayToOneDimension(item) 
          ]
        }else{
          
          return [
            ...acum,
            item
          ] 
        }
      } ,[]))
};

const printRoutes = (path, layer) => {
    if (layer.route) {
        layer.route.stack.forEach(printRoutes.bind(null, path.concat(split(layer.route.path))))
    } else if (layer.name === 'router' && layer.handle.stack) {
        layer.handle.stack.forEach(printRoutes.bind(null, path.concat(split(layer.regexp))))
    } else if (layer.method) {
        console.log('%s /%s',
            layer.method.toUpperCase(),
            path.concat(split(layer.regexp)).filter(Boolean).join('/'))
    }
};

const split = thing => {
    if (typeof thing === 'string') {
        return thing.split('/')
    } else if (thing.fast_slash) {
        return ''
    } else {
        var match = thing.toString()
            .replace('\\/?', '')
            .replace('(?=\\/|$)', '$')
            .match(/^\/\^((?:\\[.*+?^${}()|[\]\\\/]|[^.*+?^${}()|[\]\\\/])*)\$\//)
        return match
            ? match[1].replace(/\\(.)/g, '$1').split('/')
            : '<complex:' + thing.toString() + '>'
    }
};

const replaceAll = (text, search, replacement) => {
    //for (var x in obj) {
        text = text.replace(new RegExp(search, 'g'), replacement);
    
    return text;
};

const camelize = function camelize(str) {
    const firstUpper = str.replace(/[\W_]+(.)/g, function (match, chr) {
        return chr.toUpperCase();
    });
    return firstUpper.charAt(0).toUpperCase() + firstUpper.slice(1)
};

const writeJsonFile = (targetPath, jsonContent) => {
    fs.writeFileSync(targetPath, JSON.stringify(jsonContent, null, 2))
}

module.exports = {
    parseSequelizeError,
    validateRequiredFields,
    transformArrayToOneDimension,
    printRoutes,
    replaceAll,
    camelize,
    writeJsonFile
};