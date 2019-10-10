const fs = require('fs');
const path = require('path');

const readFile = (filename) => {
  const filepath = path.join(__dirname, filename);
  if(fs.existsSync(filepath)){
    return fs.readFileSync(filepath)
  }else{
    return "{}";
  }
}

const saveProjects = (projects) => {
  const filepath = path.join(__dirname, 'project.json');
  fs.writeFileSync(filepath, JSON.stringify(projects, null, 2))
}

const getProjects = () => {
  const filepath = path.join(__dirname, 'project.json');
  const projects = JSON.parse(fs.readFileSync(filepath))
  return projects;
}

const getBusinessUnits = () => {
  const filepath = path.join(__dirname, 'bussiness_units.json');
  const items = JSON.parse(fs.readFileSync(filepath))
  return items;
}

const saveProjectFolders = (project_id, folders) => {
  const filepath = path.join(__dirname, 'folders.json');

  const allFolders = getFolders();

  allFolders[project_id] = folders;

  fs.writeFileSync(filepath, JSON.stringify(allFolders, null, 2))
}

const getFolders = () => {
  const folders = JSON.parse(readFile('folders.json'))
  return folders;
}

const getProjectFolders = (project_id) => {
  const allFolders = getFolders();
  return allFolders[project_id];
}

const getProjectFoldersPath = async (project_id, path, getChildren, getRoot, force=false) => {
  const route = path.split('/');
  const allFolders = getFolders();
  let root = allFolders[project_id];

  if(!root){
    root = await getRoot(project_id)
  }

  let current = root;
  for (let index = 0; index < route.length; index++) {
    const folder = route[index];
    parent = current;
    current = current.children.find(item => {
      return item.attributes.name.includes(folder)
    })
    if(!current){
      //  Could not find folder. Need to call API to see if exists.
      let children = await getChildren(parent.id);
      current = children.find(item => item.attributes.name.includes(folder))
      
      if(current){
        //  It exits and will save folders/items
        parent.children.push(current)
      }else{
        //  Do not exits in BIM 360
        return undefined;
      }
    }

    if(!current.children){
      //  Folder is loaded but children are not.
      let children = await getChildren(current.id);
      current.children = children
    }
      
  }

  if(force){
    let children = await getChildren(current.id);
    current.children = children
  }

  saveProjectFolders(project_id, root);

  return current.children;

}

const getIssues = (project_id) => {
  const issues = JSON.parse(readFile('issues.json'))
  return issues[project_id];
}

module.exports = {
  getProjects,
  saveProjects,
  saveProjectFolders,
  getProjectFolders,
  getProjectFoldersPath,
  getBusinessUnits,
  getIssues
}