function andify (array) {
  if (array.length === 1) {
    return array
  } else {
    return _.chain(array)
      .slice(0, -2)
      .map(item => [item, {text: ', '}])
      .flatten()
      .concat(_.slice(array, -2, -1)[0])
      .concat({text: ' and '})
      .concat(_.slice(array, -1)[0])
      .value()
  }
}

function outputify (objs) {
  const outputs = _.map(objs, colorizeContact)
  return andify(outputs)
}

function colorizeContact (obj) {
  if (obj.label === 'number' && _.isString(obj.value)) {
    return {text: obj.value, argument: 'phone number'}
  } else if (obj.label === 'email' && _.isString(obj.value)) {
    return {text: obj.value, argument: 'email address'}
  } else if (obj.value.label === 'relationship') {
    return {text: obj.value.value, argument: 'relationship'}
  } else if (obj.value.label === 'contact') {
    return {text: obj.value.value, argument: 'contact'}
  }
}

export default function demoExecute (result) {
  if (result.verb === 'email') {
    return _.flatten([
      {text: 'start', category: 'action'},
      {text: ' a new email to '},
      outputify(result.to),
      result.subject ? [{text: ' with '}, {text: result.subject, argument: 'subject'}, {text: ' in the subject'}] : []
    ])
  } else if (result.verb === 'call') {
    return _.flatten([
      {text: 'call ', category: 'action'},
      outputify(result.to),
      {text: ' through your iPhone'}
    ])
  } else if (result.verb === 'facetime') {
    return _.flatten([
      {text: 'call ', category: 'action'},
      outputify(result.to),
      {text: ' in '},
      {text: 'Facetime', argument: 'application'},
    ])
  } else if (result.verb === 'text') {
    return _.flatten([
      {text: 'open ', category: 'action'},
      {text: 'Messages', argument: 'application'},
      {text: ' to a conversation with '},
      outputify(result.to)
    ])
  }
}