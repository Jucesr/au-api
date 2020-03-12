const express = require('express');
var ForgeSDK = require('forge-apis');
var HubsApi = new ForgeSDK.HubsApi(); //Hubs Client
var ProjectsApi = new ForgeSDK.ProjectsApi();
var FoldersApi = new ForgeSDK.FoldersApi();
const Cache = require('../cache/index');
const Bim360Api = require('../utils/Bim360Api');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');

let router = express.Router();
const autoRefresh = true; // or false

//  Prepare data
const {AU_CLIENT_ID, AU_SECRET_ID, HUB_ID} = process.env;

const oAuth2TwoLegged = new ForgeSDK.AuthClientTwoLegged(AU_CLIENT_ID, AU_SECRET_ID, [
  'data:read',
  'data:write',
  'account:read'
], autoRefresh);

router.get('/projects', (req, res) => {

  const params = req.query;

  if(params.force){
    //  Call BIM360 API
    oAuth2TwoLegged.authenticate().then(function(credentials){

        ProjectsApi.getHubProjects(HUB_ID, {}, oAuth2TwoLegged, credentials).then(async response => {
          const {body} = response;
          const {data} = body;

          let projects = [];

          for (let index = 0; index < data.length; index++) {
            const dataItem = data[index];
            const res = await Bim360Api.getProject(HUB_ID, dataItem.id, credentials)
            res.issue_container_id = dataItem.relationships.issues.data.id
            projects.push(res);      
          }

          //  Add Bussiness Unit

          const bussiness_units = Cache.getBusinessUnits();

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

          //  Save in Cache.
          Cache.saveProjects(projects)
          res.send(projects)
          console.log('Projects were sent')
        })

    }, function(err){
        console.error(err);
    });
  }else{
    //  Use cache data
    res.send(Cache.getProjects())
  }

  
});

router.get('/project/:id/viewerItems', async (req, res) => {
  const {query, params} = req;
  const {folderPath, force = false} = query;
  const project_id = params.id;

  const fields = ['type', 'id', 'attributes', 'relationships']

  const credentials = await oAuth2TwoLegged.authenticate()

  const getFolderContent = async (folder_id) => {
    const response = await FoldersApi.getFolderContents(project_id, folder_id, {}, oAuth2TwoLegged, credentials)
    const {body} = response;
    const {data} = body;
    return clean(data)
  }

  const getRootFolder = async (project_id, rootFolderName) => {
    const response = await ProjectsApi.getProjectTopFolders(HUB_ID, project_id, oAuth2TwoLegged, credentials)
    const {body} = response;
    const {data} = body;

    const PFfolder = _.pick(data.find(item => item.attributes.name.includes(rootFolderName)), fields);

    let children = await getFolderContent(PFfolder.id);

    PFfolder.children = children;

    return PFfolder
  }
  

  const clean = arr => arr.map(item => _.pick(item, fields))

  let foldersResponse = await Cache.getProjectFoldersPath(project_id, folderPath, getFolderContent, getRootFolder, force);    
  foldersResponse = foldersResponse ? foldersResponse : []

  console.log(`Path:${folderPath} \nItems: ${foldersResponse.length}`)
  res.send(foldersResponse)
});

router.get('/project/:id/folderContent', async (req, res) => {
  const {query, params} = req;
  const {folderPath, force = false} = query;
  const project_id = params.id;

  const fields = ['type', 'id', 'attributes', 'relationships']

  const credentials = await oAuth2TwoLegged.authenticate()

  const getFolderContent = async (folder_id) => {
    const response = await FoldersApi.getFolderContents(project_id, folder_id, {}, oAuth2TwoLegged, credentials)
    const {body} = response;
    const {data} = body;
    return clean(data)
  }

  const getRootFolder = async (project_id, rootFolderName) => {
    const response = await ProjectsApi.getProjectTopFolders(HUB_ID, project_id, oAuth2TwoLegged, credentials)
    const {body} = response;
    const {data} = body;

    const PFfolder = _.pick(data.find(item => item.attributes.name.includes(rootFolderName)), fields);

    let children = await getFolderContent(PFfolder.id);

    PFfolder.children = children;

    return PFfolder
  }
  

  const clean = arr => arr.map(item => _.pick(item, fields))

  let foldersResponse = await Cache.getProjectFoldersPath(project_id, folderPath, getFolderContent, getRootFolder, force);    
  foldersResponse = foldersResponse ? foldersResponse : []

  console.log(`Path:${folderPath} \nItems: ${foldersResponse.length}`)
  res.send(foldersResponse)
});

router.get('/project/:id/construction_schedule', async (req, res) => {
  const {query, params} = req;
  const project_id = params.id;
  
  const filepath = path.join(__dirname, '..', 'assets', 'programa_obra', `${project_id}.json`)

  if(fs.existsSync(filepath)){
    const file = fs.readFileSync(filepath)
    res.send(JSON.parse(file))
  }else{
    res.send([])
  }
  console.log(`Construction Schedule was sent: ${project_id}`)

});

router.get('/project/:id/procument_schedule', async (req, res) => {
  const {query, params} = req;
  const project_id = params.id;
  
  const filepath = path.join(__dirname, '..', 'assets', 'programa_compra', `${project_id}.json`)

  if(fs.existsSync(filepath)){
    const file = fs.readFileSync(filepath)
    res.send(JSON.parse(file))
  }else{
    res.send([])
  }
  console.log(`Procument Schedule was sent: ${project_id}`)

});

router.get('/project/:id/issues', async (req, res) => {
  const {query, params} = req;
  const project_id = params.id;
  
  let issues = Cache.getIssues(project_id);

  issues = issues ? issues : [];

  res.send(issues)
  console.log(`${issues.length} Issues were sent. Project Id = ${project_id}`)

});

router.get('/project/:id/payment_applications', async (req, res) => {
  const {query, params} = req;
  const project_id = params.id;
  
  let paymentApps = Cache.getPaymentApps(project_id);

  paymentApps = paymentApps ? paymentApps : {};

  res.send(paymentApps)
  console.log(`Payment Applications were sent. Project Id = ${project_id}`)

});

router.get('/project/:id/models', async (req, res) => {
  const {query, params} = req;
  const project_id = params.id;
  
  let items = Cache.getModels(project_id);

  items = items ? items : [];

  res.send(items)
  console.log(`${items.length} Models were sent. Project Id = ${project_id}`)
});

router.get('/getTokenViewer', async (req, res) => {
  const credentials = await oAuth2TwoLegged.authenticate()
  res.send(credentials)
  console.log(`A token for viewer was provied`)
});

module.exports = router;
 
