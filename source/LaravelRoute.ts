export interface Route {
  uri: string
  methods: Method[]
  action: Action
  isFallback: boolean
  controller: null
  defaults: any[]
  wheres: any[] | WheresClass
  parameters: null
  parameterNames: null
  computedMiddleware: null
  compiled: null
  symfony: Symfony
  input?: {
    [key: string]: string | string[]
  }
}

export interface Action {
  domain?: null
  middleware: string
  uses: string
  as?: string
  controller: string
  namespace: string | null
  prefix: string
  where: any[]
}

export enum Method {
  Delete = "DELETE",
  Get = "GET",
  Head = "HEAD",
  Post = "POST",
  Put = "PUT"
}

export interface Symfony {
  vars: string[]
  path_prefix: string
  path_regex: string
  path_tokens: Array<Array<boolean | string>>
  path_vars: string[]
  host_regex: null
  host_tokens: Array<["text", string] | ["variable", string, string, string, boolean]>
  host_vars: any[]
}

export interface WheresClass {
  scope: string
}
