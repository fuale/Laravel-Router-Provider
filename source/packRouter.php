<?php

namespace Source;

$APP_BASE_PATH = rtrim($argv[1], '/');

putenv("APP_BASE_PATH=$APP_BASE_PATH");

require_once $APP_BASE_PATH . '/vendor/autoload.php';
$app = require_once $APP_BASE_PATH . '/bootstrap/app.php';
require_once __DIR__ . "/packCommand.php";

use Source\RouteExport;
use Symfony\Component\Console\Input\ArgvInput;
use Symfony\Component\Console\Output\ConsoleOutput;
use Illuminate\Contracts\Console\Kernel;

$kernel = $app->make(Kernel::class);

$status = $kernel->handle(
    $input = new ArgvInput([
        $argv[0],
        'route:export'
    ]),
    new ConsoleOutput
);
