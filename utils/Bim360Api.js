const node_fetch = require('node-fetch');
const base_url = 'https://developer.api.autodesk.com';
const cache = require('../cache/index');

const fetch = (url, options) => node_fetch(url, options).then(res => res.json())


const getProject = (hub_id, project_id, credentials) => {
  const account_id = hub_id.substring(2);
  const project = project_id.substring(2);
  const url = `${base_url}/hq/v1/accounts/${account_id}/projects/${project}`;

  return fetch(
    url, 
    { 
      method: 'GET', 
      headers: {
        'Authorization': `Bearer ${credentials.access_token}`
      }
    }
  )
}

const getProjects = () => {
  let {projects, bussiness_units} = cache;

  const bu = bussiness_units.reduce((acum, item) => {
    return {
      ...acum,
      [item.id]: item
    }
  }, {})

  projects = projects.map(project => {
    return {
      ...project,
      uen: bu[project.business_unit_id] ? bu[project.business_unit_id].name : undefined
    } 
  })

  return projects;
}

const getIssues = (container_id, credentials) => {
  const account_id = hub_id.substring(2);
  const project = project_id.substring(2);
  const url = `${base_url}/issues/v1/containers/${container_id}/quality-issues`;
  return fetch(
    url, 
    { 
      method: 'GET', 
      headers: {
        'Authorization': `Bearer ${credentials.access_token}`
      }
    }
  )
}




module.exports = {
  getProject,
  getProjects
}