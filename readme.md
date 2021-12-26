# Laravel Router Exporter

Программа выполняет поиск и экспортирование роутеров из Laravel приложения и конвертирует их в запускаемый набор typescript функций, которые соответствуют роутам

## Использование

1. Установите [pnpm](https://pnpm.io/installation#nodejs-is-preinstalled), затем: `$ pnpm install`

2. Установите [python](https://www.python.org/downloads/source/), затем выполните команду, перенаправив вывод в файл: `$ python transfer.py [путь до laravel приложения] > [путь до файла с роутами].ts`
