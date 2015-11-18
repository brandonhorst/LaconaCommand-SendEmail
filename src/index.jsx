/** @jsx createElement */

import {createElement, Phrase} from 'lacona-phrase'
import String from 'lacona-phrase-string'
import PhoneNumber from 'lacona-phrase-phonenumber'
import EmailAddress from 'lacona-phrase-email'

export function execute (result) {
  let url

  if (result.email) {
    if (result.email.message) {
      url = `mailto:${encodeURIComponent(result.email.to.join(','))}?subject=${result.email.subject}`
    } else {
      url = `mailto:${encodeURIComponent(result.email.to.join(','))}`
    }
  } else if (result.call) {
    url = `tel://${encodeURIComponent(result.call.number[0])}`
  } else if (result.facetime) {
    url = `facetime://${encodeURIComponent(result.facetime.contact[0])}`
  } else if (result.text) {
    url = `imessage://${encodeURIComponent(result.text.contact.join(','))}`
  }

  console.log(url)
  global.openURL(url)
}

class EmailGroup extends Phrase {
  describe () {
    return (
      <repeat unique={true} separator={<list items={[' and ', ', and ', ', ']} limit={1} />}>
        <EmailAddress />
      </repeat>
    )
  }
}

class NumberGroup extends Phrase {
  describe () {
    return (
      <repeat unique={true} separator={<list items={[' and ', ', and ', ', ']} limit={1} max={this.props.max} />}>
        <PhoneNumber />
      </repeat>
    )
  }
}

class AllGroup extends Phrase {
  describe () {
    return (
      <repeat unique={true} separator={<list items={[' and ', ', and ', ', ']} limit={1} max={this.props.max} />}>
        <choice>
          <PhoneNumber />
          <EmailAddress />
        </choice>
      </repeat>
    )
  }
}

export class Sentence extends Phrase {
  describe () {
    return (
      <choice>
        <choice id='email'>
          <sequence>
            <list items={['email ', 'send an email to ', 'send email to ', 'shoot an email to ']} category='action' limit={1} />
            <EmailGroup id='to' />
          </sequence>
          <sequence>
            <list items={['send ']} category='action' limit={1} />
            <EmailGroup id='to' />
            <literal text=' an email' />
          </sequence>
          <sequence>
            <list items={['email ', 'send ']} category='action' limit={1}/>
            <String argument='subject' id='subject' limit={1} />
            <literal text=' to ' category='conjunction' />
            <EmailGroup id='to' />
          </sequence>
          <sequence>
            <list items={['email ', 'send an email to ', 'send email to ', 'shoot an email to ']} category='action' limit={1} />
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
            <choice limit={1} category='action'>
              <literal text=' an email about ' />
              <literal text=' an email ' />
              <literal text=' email about ' />
              <literal text=' email ' />
            </choice>
            <String argument='subject' id='subject' limit={1} />
          </sequence>
        </choice>
        <sequence id='call'>
          <list items={['call ', 'ring ', 'call up ', 'ring up ']} category='action' limit={1} />
          <NumberGroup id='number' max={1} />
        </sequence>
        <sequence id='facetime'>
          <literal text='facetime ' category='action' />
          <AllGroup merge={true} max={1} id='contact' />
        </sequence>
        <choice id='text'>
          <sequence>
            <list items={['text ', 'iMessage ', 'shoot a text to ', 'send a text to ']} limit={1} category='action' />
            <AllGroup id='contact' />
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
      </choice>
    )
  }
}

export default {
  sentences: [
    {Sentence, execute}
  ]
}
