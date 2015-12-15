/** @jsx createElement */

import _ from 'lodash'
import {createElement, Phrase} from 'lacona-phrase'
import String from 'lacona-phrase-string'
import PhoneNumber from 'lacona-phrase-phonenumber'
import EmailAddress from 'lacona-phrase-email'

export function execute (result) {
  let url
  const to = encodeURIComponent(_.chain(result.to).map('value').join(',').value())

  if (result.verb === 'email') {
    if (result.to) {
      url = `mailto:${to}?subject=${result.subject}`
    } else {
      url = `mailto:${to}`
    }
  } else if (result.verb === 'call') {
    url = `tel://${to}`
  } else if (result.verb === 'facetime') {
    url = `facetime://${to}`
  } else if (result.verb === 'text') {
    url = `imessage://${to}`
  }

  global.openURL(url)
}

class EmailGroup extends Phrase {
  getValue (result) {
    return result.map(email => ({label: 'email', value: email}))
  }

  describe () {
    return (
      <repeat unique={true} separator={<list items={[' and ', ', and ', ', ']} limit={1} />}>
        <EmailAddress />
      </repeat>
    )
  }
}

class NumberGroup extends Phrase {
  getValue (result) {
    return result.map(email => ({label: 'number', value: email}))
  }

  describe () {
    return (
      <repeat unique={true} separator={<list items={[' and ', ', and ', ', ']} limit={1} max={this.props.max} />}>
        <PhoneNumber />
      </repeat>
    )
  }
}

class AllGroup extends Phrase {
  getValue (result) {
    return result.map(item => {
      if (item.number) {
        return {label: 'number', value: item.number}
      } else if (item.email) {
        return {label: 'email', value: item.email}
      }
    })
  }

  describe () {
    return (
      <repeat unique={true} separator={<list items={[' and ', ', and ', ', ']} limit={1} max={this.props.max} />}>
        <choice>
          <PhoneNumber id='number' />
          <EmailAddress id='email' />
        </choice>
      </repeat>
    )
  }
}

export class Sentence extends Phrase {
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

export default {
  sentences: [
    {Sentence, execute}
  ]
}
