# Route 53 record that automatically updates with App Runner
resource "aws_route53_record" "api_domain" {
  zone_id = "Z0741953HZTWCAUPOZTP" # idoeasy.net hosted zone
  name    = var.custom_domain
  type    = "A"

  alias {
    name                   = aws_apprunner_service.backend.service_url
    zone_id                = "Z01915732ZBZKC8D32TPT" # App Runner hosted zone
    evaluate_target_health = true
  }

  depends_on = [aws_apprunner_service.backend]
}
