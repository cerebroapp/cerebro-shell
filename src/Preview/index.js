const React = require('react')
const styles = require('./styles.css')

module.exports = class Preview extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      output: `$ ${props.cmd}\n`,
      finished: false
    }
  }
  componentDidMount() {
    this.props.stderr.on('data', (data) => {
      this.setState({output: `${this.state.output}${data}`})
    })
    this.props.stderr.on('finish', () => this.setState({finished: true}))

    this.props.stdout.on('data', (data) => {
      this.setState({output: `${this.state.output}${data}`})
    })
    this.props.stdout.on('finish', () => this.setState({finished: true}))
  }
  render() {
    const end = this.state.finished ? '' : "\n▌"
    return (
      <div className={styles.preview}>
        <pre className={styles.output}>{this.state.output.trim()}{end}</pre>
      </div>
    )
  }
}
