export interface Question {
  id: string
  contrarian: boolean
  text: string
}

export interface Session {
  no: number
  id: string
  title: string
  questions: Question[]
}
