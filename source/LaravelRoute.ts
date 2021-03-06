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
  middleware: string[]
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
  Put = "PUT",
  Patch = "PATCH"
}

export type TextToken = ["text", string]
export type VariableToken = ["variable", string, string, string, boolean]
export type PathToken = TextToken | VariableToken

export interface Symfony {
  vars: string[]
  path_prefix: string
  path_regex: string
  path_tokens: PathToken[]
  path_vars: string[]
  host_regex: null
  host_tokens: any[]
  host_vars: any[]
}

export interface WheresClass {
  scope: string
}
