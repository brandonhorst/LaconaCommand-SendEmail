/** @jsx createElement */

import { createElement } from 'elliptical'
import { Command, String, PhoneNumber, EmailAddress } from 'lacona-phrases'
import { openURL } from 'lacona-api'

import _ from 'lodash'
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
    } else if (result.verb === 'facetime-audio') {
      url = `facetime-audio://${urlify(result.to)}`
    } else if (result.verb === 'text') {
      url = `imessage://${urlify(result.to, item => item.replace(/[\(\)\s-]/g, ''))}`
    }

    openURL({url})
  },

  describe () {
    return (
      <choice>
        <choice limit={1}>
          <sequence>
            <list items={['send ', 'shoot ']} limit={1} id='verb' value='email' />
            <EmailGroup id='to' />
            <literal text=' an email' ellipsis />
            <literal text=' about ' />
            <String argument='subject' id='subject' limit={1} />
          </sequence>
          <sequence>
            <list items={['email ', 'send an email to ', 'send email to ', 'shoot an email to ']} id='verb' value='email' limit={1} />
            <EmailGroup id='to' ellipsis />
            <list items={[' about ', ' ']} limit={1} />
            <String argument='subject' id='subject' limit={1} />
          </sequence>
          <sequence>
            <literal text='email ' id='verb' value='email' />
            <String argument='subject' id='subject' limit={1} />
            <literal text=' to ' />
            <EmailGroup id='to' />
          </sequence>
        </choice>
        <choice limit={1}>
          <sequence>
            <list items={['call ']} limit={1} id='verb' value='call' />
            <NumberGroup id='to' max={1} />
          </sequence>
          <sequence>
            <list items={['give ']} limit={1} id='verb' value='call' />
            <NumberGroup id='to' max={1} />
            <list items={[' a call ', ' a ring']} limit={1} id='verb' value='call' />
          </sequence>
        </choice>
        <choice limit={1}>
          <sequence>
            <literal text='facetime ' id='verb' value='facetime' />
            <literal text='audio ' id='verb' value='facetime-audio' optional />
            <AllGroup max={1} id='to' />
          </sequence>
          <sequence>
            <literal text='give ' id='verb' value='facetime' />
            <AllGroup max={1} id='to' />
            <choice id='verb'>
              <list items={[' a facetime call']} value='facetime' />
              <list items={[' a facetime audio call']} value='facetime-audio' />
            </choice>
          </sequence>
        </choice>
        <choice limit={1}>
          <sequence>
            <list items={['send ', 'shoot ']} limit={1} id='verb' value='text' />
            <AllGroup id='to' />
            <list items={[' a text', ' an iMessage']} limit={1} id='verb' value='text' />
          </sequence>
          <sequence>
            <list items={['text ', 'iMessage ', 'send a text to ', 'shoot a text to ']} limit={1} id='verb' value='text' />
            <AllGroup id='to' />
          </sequence>
        </choice>
          {/* <sequence>
            <list items={['text ', 'iMessage ']} limit={1} />
            <String argument='message' id='message' limit={1} />
            <literal text=' to ' />
            <AllGroup merge={true} />
          </sequence>
          <sequence>
            <list items={['send ']} limit={1} />
            <AllGroup merge={true} />
            <choice limit={1} 
              <literal text=' a text saying ' />
              <literal text=' an iMessage saying' />
              <literal text=' a text ' />
              <literal text=' an iMessage' />
            </choice>
            <String argument='message' id='message' limit={1} />
          </sequence>
          <sequence>
            <list items={['text ', 'iMessage ']} limit={1} />
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
