# Laravel Router Exporter

Export laravel routes into callable typescript functions

Программа выполняет поиск и экспортирование роутеров из Laravel приложения и конвертирует их в запускаемый набор typescript функций, которые соответствуют роутам

The program searches for and exports routers from a Laravel application and converts them into a runnable set of typescript functions that correspond to routes

## Usage

1. Clone project
1. Install pnpm [pnpm](https://pnpm.io/installation#nodejs-is-preinstalled), then run: `$ pnpm install`

## Output

A file containing routes with types will be generated

example below

## Использование

1. Установите [pnpm](https://pnpm.io/installation#nodejs-is-preinstalled), затем: `$ pnpm install`

2. Установите [python](https://www.python.org/downloads/source/), затем выполните команду, перенаправив вывод в файл: `$ ./transfer.py -s=<path/to/laravel/app> -d=<path/to/routes>.ts`

## Что на выходе

Будет сгенерирован файл содержащий роуты с типами

```typescript
import ky, { Options } from "ky"

export const getRoutes = (client: typeof ky) => ({
  CsrfCookieShow: (options?: Partial<Options>) => {
    return client.get(`sanctum/csrf-cookie`, options)
  },
  PostStore: (
    {
      title,
      description,
      startAt,
      count,
      parameter
    }: {
      title?: string
      description?: string
      startAt?: Date
      count?: number
      parameter?: string
    },
    options?: Partial<Options>
  ) => {
    return client.get(`api/some-route/${parameter}`, {
      searchParams: {
        title: String(title),
        description: String(description),
        start_at: String(startAt),
        count: String(count)
      },
      ...options
    })
  },
  PostUpdate: (
    {
      some,
      param,
      parameter,
      another
    }: {
      some?: string
      param?: number
      parameter?: string
      another?: string
    },
    options?: Partial<Options>
  ) => {
    return client.post(`api/some-route/${parameter}/${another}/end`, {
      json: {
        some,
        param
      },
      ...options
    })
  }
})
```

## Ограничения / Limitations

- Только FormRequest параметры для контроллера / Only FormRequest class
- Только роуты, указанные с использованием синтаксиса [Some::class, 'method'] / Only syntax [Some::class, 'method']
- В качестве клиента использутеся [ky](https://github.com/sindresorhus/ky) (требуется установить для проекта)
