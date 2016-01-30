/** @jsx createElement */

import _ from 'lodash'
import { createElement, Phrase } from 'lacona-phrase'
import { String } from 'lacona-phrase-string'
import { Command } from 'lacona-command'
import { PhoneNumber } from 'lacona-phrase-phone-number'
import { EmailAddress } from 'lacona-phrase-email'
import { openURL } from 'lacona-api'

class EmailGroup extends Phrase {
  getValue (result) {
    return {label: 'email', value: result}
  }

  describe () {
    return (
      <repeat unique separator={<list items={[' and ', ', and ', ', ']} limit={1} />}>
        <map function={this.getValue.bind(this)}>
          <EmailAddress />
        </map>
      </repeat>
    )
  }
}

class NumberGroup extends Phrase {
  getValue (result) {
    return {label: 'number', value: result}
  }

  describe () {
    return (
      <repeat unique separator={<list items={[' and ', ', and ', ', ']} limit={1} max={this.props.max} />}>
        <map function={this.getValue.bind(this)}>
          <PhoneNumber />
        </map>
      </repeat>
    )
  }
}

class AllGroup extends Phrase {
  getValue (result) {
    if (result.number) {
      return {label: 'number', value: result.number}
    } else if (result.email) {
      return {label: 'email', value: result.email}
    }
  }

  describe () {
    return (
      <repeat unique separator={<list items={[' and ', ', and ', ', ']} limit={1} max={this.props.max} />}>
        <map function={this.getValue.bind(this)}>
          <choice>
            <PhoneNumber id='number' />
            <EmailAddress id='email' />
          </choice>
        </map>
      </repeat>
    )
  }
}

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

class CommandObject {
  constructor ({verb, to, subject}) {
    this.verb = verb
    this.to = to
    this.subject = subject
  }

  _demoExecute () {
    if (this.verb === 'email') {
      return _.flatten([
        {text: 'start', category: 'action'},
        {text: ' a new email to '},
        outputify(this.to),
        this.subject ? [{text: ' with '}, {text: this.subject, argument: 'subject'}, {text: ' in the subject'}] : []
      ])
    } else if (this.verb === 'call') {
      return _.flatten([
        {text: 'call ', category: 'action'},
        outputify(this.to),
        {text: ' through your iPhone'}
      ])
    } else if (this.verb === 'facetime') {
      return _.flatten([
        {text: 'call ', category: 'action'},
        outputify(this.to),
        {text: ' in '},
        {text: 'Facetime', argument: 'application'},
      ])
    } else if (this.verb === 'text') {
      return _.flatten([
        {text: 'open ', category: 'action'},
        {text: 'Messages', argument: 'application'},
        {text: ' to a conversation with '},
        outputify(this.to)
      ])
    }
  }

  execute () {
    let url

    if (this.verb === 'email') {
      if (this.subject) {
        const subject = encodeURIComponent(this.subject)
        url = `mailto:${urlify(this.to)}?subject=${subject}`
      } else {
        url = `mailto:${urlify(this.to)}`
      }
    } else if (this.verb === 'call') {
      url = `tel://${urlify(this.to)}`
    } else if (this.verb === 'facetime') {
      url = `facetime://${urlify(this.to)}`
    } else if (this.verb === 'text') {
      url = `imessage://${urlify(this.to, item => item.replace(/[\(\)\s-]/g, ''))}`
    }

    openURL({url})
  }
}

function urlify (to, fn = _.identity) {
  return _.chain(to)
    .map('value')
    .map(fn)
    .map(encodeURIComponent)
    .map(item => item.replace(/%2B/g, '+'))
    .join(',')
    .value()
}

export class Communicate extends Phrase {
  static extends = [Command]

  describe () {
    return (
      <map function={result => new CommandObject(result)}>
        <choice>
          <sequence>
            <list items={['email ', 'send an email to ', 'send email to ', 'shoot an email to ']} category='action' id='verb' value='email' limit={1} />
            <EmailGroup id='to' />
          </sequence>
          <sequence>
            <list items={['send ']} id='verb' value='email' category='action' limit={1} />
            <EmailGroup id='to' />
            <literal text=' an email' />
          </sequence>
          <sequence>
            <list items={['email ', 'send ']} id='verb' value='email' category='action' limit={1}/>
            <String argument='subject' id='subject' limit={1} />
            <literal text=' to ' category='conjunction' />
            <EmailGroup id='to' />
          </sequence>
          <sequence>
            <list items={['email ', 'send an email to ', 'send email to ', 'shoot an email to ']} id='verb' value='email' category='action' limit={1} />
            <EmailGroup id='to' />
            <choice limit={1}>
              <literal text=' about ' />
              <literal text=' ' />
            </choice>
            <String argument='subject' id='subject' limit={1} />
          </sequence>
          <sequence>
            <list items={['send ']} category='action' limit={1} />
            <EmailGroup id='to' />
            <list limit={1} category='action' items={[' an email about ', ' an email ', ' email about ', ' email ']} id='verb' value='email' />
            <String argument='subject' id='subject' limit={1} />
          </sequence>
          <sequence>
            <list items={['call ', 'ring ', 'call up ', 'ring up ']} category='action' limit={1} id='verb' value='call' />
            <NumberGroup id='to' max={1} />
          </sequence>
          <sequence>
            <literal text='facetime ' category='action' id='verb' value='facetime' />
            <AllGroup max={1} id='to' />
          </sequence>
          <sequence>
            <list items={['text ', 'iMessage ', 'shoot a text to ', 'send a text to ']} limit={1} category='action' id='verb' value='text' />
            <AllGroup id='to' />
          </sequence>
            {/* <sequence>
              <list items={['text ', 'iMessage ']} limit={1} category='action' />
              <String argument='message' id='message' limit={1} />
              <literal text=' to ' category='conjunction' />
              <AllGroup merge={true} />
            </sequence>
            <sequence>
              <list items={['send ']} limit={1} category='action' />
              <AllGroup merge={true} />
              <choice limit={1} category='action'>
                <literal text=' a text saying ' />
                <literal text=' an iMessage saying' />
                <literal text=' a text ' />
                <literal text=' an iMessage' />
              </choice>
              <String argument='message' id='message' limit={1} />
            </sequence>
            <sequence>
              <list items={['text ', 'iMessage ']} limit={1} category='action' />
              <AllGroup merge={true} />
              <choice limit={1}>
                <literal text=' saying ' />
                <literal text=' ' />
              </choice>
              <String argument='message' id='message' limit={1} />
            </sequence>*/}
        </choice>
      </map>
    )
  }
}

export const extensions = [Communicate]
