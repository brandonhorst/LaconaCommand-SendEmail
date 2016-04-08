/** @jsx createElement */

import _ from 'lodash'
import { createElement } from 'elliptical'
import { String } from 'elliptical-string'
import { Command } from 'lacona-command'
import { PhoneNumber } from 'elliptical-phone'
import { EmailAddress } from 'elliptical-email'
import { openURL } from 'lacona-api'
import demoExecute from './demo'

function mapEmailGroup (option) {
  const result =  {label: 'email', value: option.result}
  return _.assign({}, option, {result})
}

const EmailGroup = {
  describe () {
    return (
      <repeat unique separator={<list items={[' and ', ', and ', ', ']} limit={1} />}>
        <map outbound={mapEmailGroup} skipIncomplete>
          <EmailAddress />
        </map>
      </repeat>
    )
  }
}

function mapNumberGroup (option) {
  const result = {label: 'number', value: option.result}
  return _.assign({}, option, {result})
}

const NumberGroup = {
  describe ({props}) {
    return (
      <repeat unique separator={<list items={[' and ', ', and ', ', ']} limit={1} max={props.max} />}>
        <map outbound={mapNumberGroup} skipIncomplete>
          <PhoneNumber />
        </map>
      </repeat>
    )
  }
}

function mapAllGroup (option) {
  let result
  if (option.result.number) {
    result = {label: 'number', value: option.result.number}
  } else if (option.result.email) {
    result = {label: 'email', value: option.result.email}
  }

  return _.assign({}, option, {result})
}

const AllGroup = {
  describe ({props}) {
    return (
      <repeat unique separator={<list items={[' and ', ', and ', ', ']} limit={1} max={props.max} />}>
        <map outbound={mapAllGroup} skipIncomplete>
          <choice>
            <PhoneNumber id='number' />
            <EmailAddress id='email' />
          </choice>
        </map>
      </repeat>
    )
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

export const Communicate = {
  extends: [Command],

  demoExecute,
  
  execute (result) {
    let url

    if (result.verb === 'email') {
      if (result.subject) {
        const subject = encodeURIComponent(result.subject)
        url = `mailto:${urlify(result.to)}?subject=${subject}`
      } else {
        url = `mailto:${urlify(result.to)}`
      }
    } else if (result.verb === 'call') {
      url = `tel://${urlify(result.to)}`
    } else if (result.verb === 'facetime') {
      url = `facetime://${urlify(result.to)}`
    } else if (result.verb === 'text') {
      url = `imessage://${urlify(result.to, item => item.replace(/[\(\)\s-]/g, ''))}`
    }

    openURL({url})
  },

  describe () {
    return (
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
    )
  }
}

export const extensions = [Communicate]
