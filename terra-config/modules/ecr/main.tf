# Frontend image registry
resource "aws_ecr_repository" "frontend" {
  name                 = var.frontend_name
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    # Automatically scans every image you push for security vulnerabilities
    # Results visible in the ECR console — shows CVEs found in your image
    scan_on_push = true
  }

  tags = { Name = var.frontend_name }
}

# Backend image registry
resource "aws_ecr_repository" "backend" {
  name                 = var.backend_name
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = { Name = var.backend_name }
}

# Lifecycle policy
# Automatically deletes old images when you have more than 10
# Prevents ECR storage costs from growing over time as you push new images
resource "aws_ecr_lifecycle_policy" "frontend" {
  repository = aws_ecr_repository.frontend.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images, delete older ones"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}

resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images, delete older ones"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}