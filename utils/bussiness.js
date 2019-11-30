
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const {generateRandomString} = require('./utils')
const {saveIssues} = require('../cache/index')

const convertSchedule = (source, target) => {
  const data = fs.readFileSync(path.join(__dirname, '..', 'assets', 'originals', source));
  
  var parser = new xml2js.Parser();
  parser.parseString(data, function (err, result) {
    const {Task: Tasks} = result.Project.Tasks[0];
    const GantTasks = Tasks.map((task, index) => {
      // const parent = task.WBS[0].substring(0, task.WBS[0].length - 2);
      const parts = task.WBS[0].split('.');
      parts.pop();
      const parent = parts.join('.');

      //  Find model link
      const ModelLinkObj = task.ExtendedAttribute ? task.ExtendedAttribute.filter(item => item.FieldID == "188743734") : []
      const ActivityPhaseObj = task.ExtendedAttribute ? task.ExtendedAttribute.filter(item => item.FieldID == "188743737") : []
      
      const ModelLink = ModelLinkObj.length > 0 ? ModelLinkObj[0].Value[0] : undefined
      const ActivityPhase = ActivityPhaseObj.length > 0 ? ActivityPhaseObj[0].Value[0] : undefined
      return {
        parent,
        TaskID: task.UID[0],
        TaskName: task.Name[0],
        StartDate: new Date(task.Start[0]),
        EndDate: new Date(task.Finish[0]),
        Duration: parseMSDateToDays(task.Duration[0]), 
        Progress: task.PercentComplete[0],
        WBS: task.WBS[0],
        IsItem: task.Type[0] == "0",
        ModelLink: ModelLink,
        ActivityPhase: ActivityPhase
      }
    })

    let GantTasksHirachy = GantTasks.reduce((acum, item) => {
      if(item.parent == ""){
        return [
          ...acum,
          {
            ...item,
            level: 0
          }
        ]
      }

      const findParent = (items, level) => {
        items.forEach(element => {
          if(element.WBS == item.parent){
            if(!element.subtasks){
              element.subtasks = []
            }
            element.subtasks.push({
              ...item,
              level: level
            });
          }

          if(element.subtasks){
            findParent(element.subtasks, level + 1)
          }

        });
      }

      findParent(acum, 1)

      return acum
    }, [])

    //   Remove first element

    GantTasksHirachy.shift();
    delete GantTasksHirachy[0].ModelLink
    delete GantTasksHirachy[0].ActivityPhase

    fs.writeFileSync(path.join(__dirname, '..', 'assets', 'programa_obra', `${target}.json`), JSON.stringify(GantTasksHirachy, null, 2))
});
}

const parseMSDateToDays = (MSDate) => {
  const hours = MSDate.substring(2, MSDate.indexOf('H'));
  return hours / 8;
}

const generateFakeIssues = (project, number_of_issues) => {
  const {start_date, end_date, id} = project;

  const messages = {
    design: [
      'Structure plan ES-201 is missing',
      'Description of plan E-201 is incorrect',
      'Rod number is not specified',
      'There is no plan for Section B',
      'Missing information for Parking lot',
      'Sidewalk goes beyond plan scope',
      'On Hold: Until structural design define the domolition required for structural main frames',
      'Missing details for access guarhouse',
      'On hold: Untill the plumbing designer define the coonection point of domestic water',
      'The windows do not fit due to their size',
      'Model is not according to established LOD',
      'There is a change order that requires to put two more windows in the conference room.',
      'According to the plans, there are not enough downspouts.',
      'There are two toilettes missing in each bathroom according to the specifications.',
    ],
    security: [
      'People from Conza are not wearing security equipment',
      'There is no secure path to walk in section B',
      'There is to protocol for pouring concrete',
      'A flat tire in Crane for til-up walls',
      'The type of stairs does not comply with the code of safety established in the contract'
    ],
    quality: [
      'Concrete was not a right temperature',
      'Til-up walls has many scars',
      'Slope was not formed according to detail',
      'Cleaning was not perform in platform',
      'Tucuruguay material was not properly spread',
      'Wrong color of the doors',
      'Stairs must comply with projects NOM.',
      'The percentage of construction of the stairs is insufficient according to the schedule of the project',
      'The concrete type does not comply with the requirements of the client.'
    ]
  }

  const status = ['open','open','open', 'close']
  
  let arr = []

  for (let index = 0; index < number_of_issues; index++) {
    //  Get random number
    let n = Math.floor(Math.random() * 3);
    let kind = n == 0 ? 'design' : (n == 1 ? 'security' : 'quality');
    let issues_list = messages[kind]

    arr.push({
      id: generateRandomString(42),
      type: kind,
      attributes: {
        title: issues_list[Math.floor(Math.random() * issues_list.length)],
        due_date: new Date(+start_date + Math.random() * (end_date - start_date)),
        status: status[Math.floor(Math.random() * 4)]
      }
    })
    
  }

  saveIssues(id, arr)
  // fs.writeFileSync('./issues.json', JSON.stringify(projects, null, 2))
}

module.exports = {
  convertSchedule,
  generateFakeIssues
}

// generateFakeIssues({
//   start_date: new Date('06-05-2019'),
//   end_date: new Date('03-10-2020'),
//   id: 'b.496173fb-c600-4e9d-aeac-8aeb054999c2'
// }, 18)

// convertSchedule('PROGRAMA MEDLINE.xml', `b.6eec3ddb-4f30-44e2-a969-3652fda82609`);
// convertSchedule('PROGRAMA TRUPPER.xml', `b.89a69405-af59-48b9-8864-2c6f1c1b206a`);
// convertSchedule('PROGRAMA CATERPILLAR.xml', `b.f32621e9-e29e-45d4-b74b-96aff830e91b`);
// convertSchedule('PROGRAMA PROLOGIS.xml', `b.496173fb-c600-4e9d-aeac-8aeb054999c2`);

// const projects = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'cache', 'project.json')));

// const filter_projects = projects.filter( p => p.name.startsWith('AU_'))

// fs.writeFileSync(path.join(__dirname, '..', 'cache', 'project.json'), JSON.stringify(filter_projects, null, 2))
  