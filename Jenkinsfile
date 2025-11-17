pipeline {
    agent any

    environment {
        DOCKER_HOST = 'unix:///var/run/docker.sock'
    }

    stages {
        stage('Construir contenedores') {
            steps {
                sh 'docker-compose build'
            }
        }
/*
        stage('Ejecutar pruebas') {
            steps {
                sh 'docker-compose run --rm web python -m unittest discover tests'
            }
        }
*/
        stage('Desplegar') {
            steps {
                sh 'docker-compose up -d'
            }
        }
    }
}