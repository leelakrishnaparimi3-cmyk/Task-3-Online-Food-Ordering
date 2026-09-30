pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
        timestamps()
    }

    environment {
        COMPOSE = 'C:\\ProgramData\\docker\\cli-plugins\\docker-compose.exe'

        COMPOSE_PROJECT_NAME = 'food-ordering'

        POSTGRES_DB = 'foodorders'
        POSTGRES_USER = 'fooduser'
        POSTGRES_PASSWORD = 'foodpassword'

        DB_HOST = 'localhost'
        DB_PORT = '5432'
        DB_NAME = 'foodorders'
        DB_USER = 'fooduser'
        DB_PASSWORD = 'foodpassword'

        API_PORT = '3000'
        NGINX_PORT = '8080'

        TEST_CUSTOMER = 'JenkinsTest'
        TEST_FOOD = 'Burger'
        TEST_QUANTITY = '2'
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out project from Git'
                checkout scm
            }
        }

        stage('Check Docker') {
            steps {
                bat 'docker --version'
                bat '"%COMPOSE%" version'
            }
        }

        stage('Validate Compose') {
            steps {
                bat '"%COMPOSE%" config'
            }
        }

        stage('Build Order API') {
            steps {
                bat '"%COMPOSE%" build order-api'
            }
        }

        stage('Deploy Environment') {
            steps {
                bat '"%COMPOSE%" up -d'
            }
        }

stage('Wait for Application') {
    steps {
        script {
            retry(12) {
                sleep 5
                bat '''
                powershell -NoProfile -Command "$r = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:8080/health'; if ($r.StatusCode -ne 200) { exit 1 }"
                '''
            }
        }
    }
}
stage('Create Test Order') {
    steps {
        bat '''
        powershell -NoProfile -Command "$body = @{customer_name=$env:TEST_CUSTOMER; food_item=$env:TEST_FOOD; quantity=[int]$env:TEST_QUANTITY} | ConvertTo-Json; $result = Invoke-RestMethod -Method Post -Uri 'http://localhost:8080/orders' -ContentType 'application/json' -Body $body; $result | ConvertTo-Json"
        '''
    }
}

       stage('Retrieve Orders') {
    steps {
        bat '''
        powershell -NoProfile -Command "$result = Invoke-RestMethod -Method Get -Uri 'http://localhost:8080/orders'; $result | ConvertTo-Json -Depth 5"
        '''
    }
}

        stage('Verify Database') {
            steps {
                bat '''
                "%COMPOSE%" exec -T db psql -U fooduser -d foodorders -c "SELECT id, customer_name, food_item, quantity, created_at FROM orders ORDER BY id DESC LIMIT 5;"
                '''
            }
        }
    }

    post {

        failure {
            echo 'Pipeline failed. Collecting container status and logs...'

            bat '"%COMPOSE%" ps'

            bat '"%COMPOSE%" logs --no-color'
        }

        always {
            echo 'Stopping application containers and network. Keeping database volume.'

            bat '"%COMPOSE%" down'
        }
    }
}
