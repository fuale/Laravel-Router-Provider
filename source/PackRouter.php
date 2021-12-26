<?php

namespace Source;

$APP_BASE_PATH = rtrim($argv[1], '/');

putenv("APP_BASE_PATH=$APP_BASE_PATH");

require_once $APP_BASE_PATH . '/vendor/autoload.php';
$app = require_once $APP_BASE_PATH . '/bootstrap/app.php';

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Console\Command;
use Illuminate\Routing\Route as RoutingRoute;
use Illuminate\Support\Facades\Route;
use ReflectionClass;
use ReflectionException;
use ReflectionMethod;

$kernel = $app->make(Kernel::class);

$kernel->registerCommand(
    new class extends Command
    {
        protected $signature = 'route:export';

        public function handle()
        {
            $routes = Route::getRoutes();
            $data = [];

            foreach ($routes as $route) {
                /** @var RoutingRoute $route */
                $item = json_decode(json_encode($route), true);
                $controller = explode('@', $route->getActionName(), 2);
                if (count($controller) < 2) {
                    continue;
                }

                $method = new ReflectionMethod(...$controller);
                foreach ($method->getParameters() as $parameter) {
                    if (!$parameter?->getType()) {
                        continue;
                    }

                    $class = $parameter->getType()->getName();
                    if (!$class) {
                        continue;
                    }

                    try {
                        $type = new ReflectionClass($class);
                    } catch (ReflectionException) {
                        continue;
                    }

                    $parent = $type->getParentClass();
                    if (!$parent) {
                        continue;
                    }

                    if ($parent->getName() === 'Illuminate\Foundation\Http\FormRequest') {
                        $request = new ReflectionClass($type->getName());
                        $instance = $request->newInstanceWithoutConstructor();
                        $item['input'] = $request->getMethod('rules')->invoke($instance);
                    }
                }

                $tokens = $route->toSymfonyRoute()->compile()->__serialize();
                $item['symfony'] = $tokens;

                $data[] = $item;
            }

            echo json_encode($data);

            return Command::SUCCESS;
        }
    }
);

$kernel->call("route:export");
