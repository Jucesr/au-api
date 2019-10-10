
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

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
      return {
        parent,
        TaskID: task.UID[0],
        TaskName: task.Name[0],
        StartDate: new Date(task.Start[0]),
        EndDate: new Date(task.Finish[0]),
        Duration: parseMSDateToDays(task.Duration[0]), 
        Progress: task.PercentComplete[0],
        WBS: task.WBS[0],
        IsItem: task.Type[0] == "0"
      }
    })

    const GantTasksHirachy = GantTasks.reduce((acum, item) => {
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

    fs.writeFileSync(path.join(__dirname, '..', 'assets', 'programa_obra', `${target}.json`), JSON.stringify(GantTasksHirachy, null, 2))
});
}

const parseMSDateToDays = (MSDate) => {
  const hours = MSDate.substring(2, MSDate.indexOf('H'));
  return hours / 8;
}

module.exports = {
  convertSchedule
}

convertSchedule('PROLOGIS PROGRAMA.xml', `b.496173fb-c600-4e9d-aeac-8aeb054999c2`);
convertSchedule('PROGRAMA TRUPER.xml', `b.89a69405-af59-48b9-8864-2c6f1c1b206a`);
convertSchedule('MasterPlan.xml', `b.f32621e9-e29e-45d4-b74b-96aff830e91b`);